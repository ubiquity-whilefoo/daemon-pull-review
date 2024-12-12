import { customOctokit } from "@ubiquity-os/plugin-sdk/octokit";
import { logger } from "../helpers/errors";
import { formatSpecAndPull } from "../helpers/format-spec-and-pull";
import { fetchIssue } from "../helpers/issue-fetching";
import { getTaskNumberFromPullRequest } from "../helpers/pull-helpers/get-task-spec";
import { CodeReviewStatus } from "../types/pull-requests";
import { fetchRepoLanguageStats, fetchRepoDependencies } from "./ground-truths/fetch-deps";
import { findGroundTruths } from "./ground-truths/find-ground-truths";
import { Context } from "../types";
import { CallbackResult } from "../types/proxy";
import { hasCollaboratorConvertedPr } from "../helpers/pull-helpers/has-collaborator-converted";
import { parsePullReviewData } from "../helpers/pull-review-result-parsing";

export class PullReviewer {
  context: Context;
  private _oneDay = 24 * 60 * 60 * 1000;

  constructor(context: Context<"pull_request.opened" | "pull_request.ready_for_review">) {
    this.context = context;
  }

  /**
   * Perform initial checks on a pull request to determine if review is needed
   * @returns CallbackResult indicating the status and reason
   */
  async performPullPrecheck(): Promise<CallbackResult> {
    const { logger, payload } = this.context;
    const { pull_request } = payload;

    // Check if PR is in draft mode, closed, or if we can perform a review
    if (pull_request.draft) {
      return { status: 200, reason: logger.info("PR is in draft mode, no action required").logMessage.raw };
    } else if (pull_request.state === "closed") {
      return { status: 200, reason: logger.info("PR is closed, no action required").logMessage.raw };
    } else if (!(await this.canPerformReview())) {
      return { status: 200, reason: logger.info("Cannot perform review at this time").logMessage.raw };
    } else if (await hasCollaboratorConvertedPr(this.context)) {
      return { status: 200, reason: logger.info("Collaborator has converted the PR, no action required").logMessage.raw };
    }

    return await this._handleCodeReview();
  }

  /**
   * Handle the code review process for a pull request
   * @returns CallbackResult indicating the status and reason
   */
  private async _handleCodeReview(): Promise<CallbackResult> {
    const { payload } = this.context;
    const pullReviewData = await this.reviewPull();
    const { reviewComment, confidenceThreshold } = parsePullReviewData(pullReviewData.answer);

    this.context.logger.info(
      await this.convertPullToDraft(confidenceThreshold < 0.5, {
        nodeId: payload.pull_request.node_id,
        octokit: this.context.octokit,
      })
    );

    await this.submitCodeReview(reviewComment, confidenceThreshold > 0.5 ? "COMMENT" : "REQUEST_CHANGES");
    return { status: 200, reason: "Success" };
  }

  /**
   * Submit a code review for a pull request
   * @param review - The review comment
   * @param status - The review status (APPROVE, REQUEST_CHANGES, COMMENT)
   */
  async submitCodeReview(review: string, status: CodeReviewStatus): Promise<void> {
    const { logger, payload } = this.context;
    const { number, organization, repository, action, sender } = payload;
    const { owner, name } = repository;

    logger.info(`${organization}/${repository}#${number} - ${action} - ${sender.login} - ${review}`);

    try {
      const response = await this.context.octokit.rest.pulls.createReview({
        owner: owner.login,
        repo: name,
        pull_number: number,
        body: review,
        event: status,
      });
      logger.info(`Code review submitted: ${response.data.html_url}`);
    } catch (er) {
      throw logger.error("Failed to submit code review", { err: er });
    }
  }

  /**
   * Check if a review can be performed on the pull request
   * @returns boolean indicating if review can be performed
   */
  async canPerformReview(): Promise<boolean> {
    const { logger, payload } = this.context;
    const { number, organization, repository, action } = payload;
    const { owner, name } = repository;

    logger.info(`${organization}/${repository}#${number} - ${action}`);
    const timeline = await this.context.octokit.rest.issues.listEvents({
      owner: owner.login,
      repo: name,
      issue_number: number,
    });

    const reviews = timeline.data.filter((event) => event.event === "reviewed");
    const botReviews = reviews.filter((review) => review.actor.type === "Bot");

    if (!botReviews.length) {
      logger.info("No bot reviews found");
      return true;
    }

    const lastReview = botReviews[botReviews.length - 1];
    const lastReviewDate = new Date(lastReview.created_at);
    const now = new Date();
    const diff = now.getTime() - lastReviewDate.getTime();

    if (diff < this._oneDay) {
      throw logger.error("Only one review per day is allowed");
    }

    logger.info("One review per day check passed");
    return true;
  }

  /**
   * Convert a pull request to draft mode
   * @param shouldConvert - Whether to convert the PR to draft
   * @param params - Parameters including nodeId and octokit instance
   */
  async convertPullToDraft(
    shouldConvert: boolean,
    params: {
      nodeId: string;
      octokit: InstanceType<typeof customOctokit>;
    }
  ): Promise<string> {
    if (!shouldConvert) {
      return `No action taken. The pull request will remain in its current state.`;
    }

    const toDraft = `mutation {
      convertPullRequestToDraft(input: {pullRequestId: "${params.nodeId}"}) {
        pullRequest {
          id
          number
          isDraft
          title
        }
      }
    }`;

    try {
      await params.octokit.graphql(toDraft);
      return `Successfully converted pull request to draft mode.`;
    } catch (err) {
      return `Failed to convert pull request to draft mode: ${JSON.stringify(err)}`;
    }
  }

  /**
   * Review a pull request using AI completion
   * @returns The completion result from the AI model
   */
  async reviewPull() {
    const {
      env: { UBIQUITY_OS_APP_NAME },
      config: { anthropicAiModel },
      adapters: {
        anthropic: { completions },
      },
    } = this.context;

    const taskNumber = await getTaskNumberFromPullRequest(this.context);
    const issue = await fetchIssue({
      context: this.context,
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name,
      issueNum: taskNumber,
    });

    if (!issue) {
      throw logger.error(`Error fetching issue, Aborting`, {
        owner: this.context.payload.repository.owner.login,
        repo: this.context.payload.repository.name,
        issue_number: taskNumber,
      });
    }

    const taskSpecification = issue.body ?? "";
    const formattedSpecAndPull = await formatSpecAndPull(this.context, issue);
    const [languages, { dependencies, devDependencies }] = await Promise.all([fetchRepoLanguageStats(this.context), fetchRepoDependencies(this.context)]);

    let groundTruths = this._collectGroundTruths(languages, dependencies, devDependencies);

    if (groundTruths.length === 3) {
      return await completions.createCompletion(
        anthropicAiModel,
        formattedSpecAndPull,
        groundTruths,
        UBIQUITY_OS_APP_NAME,
        completions.getModelMaxTokenLimit(anthropicAiModel)
      );
    }

    groundTruths = await findGroundTruths(this.context, { taskSpecification });
    return await completions.createCompletion(
      anthropicAiModel,
      formattedSpecAndPull,
      groundTruths,
      UBIQUITY_OS_APP_NAME,
      completions.getModelMaxTokenLimit(anthropicAiModel)
    );
  }

  /**
   * Collect ground truths based on repository analysis
   */
  private _collectGroundTruths(languages: [string, number][], dependencies: Record<string, string>, devDependencies: Record<string, string>): string[] {
    const groundTruths: string[] = [];

    if (!languages.length) {
      groundTruths.push("No languages found in the repository");
    }
    if (dependencies && !Reflect.ownKeys(dependencies).length) {
      groundTruths.push("No dependencies found in the repository");
    }
    if (devDependencies && !Reflect.ownKeys(devDependencies).length) {
      groundTruths.push("No devDependencies found in the repository");
    }

    return groundTruths;
  }
}

import { Context } from "../types";
import { fetchIssue } from "../helpers/issue-fetching";
import { formatSpecAndPull } from "../helpers/format-spec-and-pull";
import { fetchRepoDependencies, fetchRepoLanguageStats } from "./ground-truths/fetch-deps";
import { findGroundTruths } from "./ground-truths/find-ground-truths";
import { logger } from "../helpers/errors";
import { getTaskNumberFromPullRequest } from "../helpers/pull-helpers/get-task-spec";

export async function pullReview(context: Context<"pull_request.opened" | "pull_request.ready_for_review">) {
  const {
    env: { UBIQUITY_OS_APP_NAME },
    config: { anthropicAiModel },
    adapters: {
      anthropic: { completions },
    },
  } = context;

  const taskNumber = await getTaskNumberFromPullRequest(context);

  const issue = await fetchIssue({
    context,
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    issueNum: taskNumber,
  });

  if (!issue) {
    throw logger.error(`Error fetching issue, Aborting`, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: taskNumber,
    });
  }

  const taskSpecification = issue.body ?? "";
  const formattedSpecAndPull = await formatSpecAndPull(context, issue);
  const [languages, { dependencies, devDependencies }] = await Promise.all([fetchRepoLanguageStats(context), fetchRepoDependencies(context)]);

  let groundTruths: string[] = [];
  if (!languages.length) {
    groundTruths.push("No languages found in the repository");
  }
  if (dependencies && !Reflect.ownKeys(dependencies).length) {
    groundTruths.push("No dependencies found in the repository");
  }
  if (devDependencies && !Reflect.ownKeys(devDependencies).length) {
    groundTruths.push("No devDependencies found in the repository");
  }

  if (groundTruths.length === 3) {
    return await completions.createCompletion(
      anthropicAiModel,
      formattedSpecAndPull,
      groundTruths,
      UBIQUITY_OS_APP_NAME,
      completions.getModelMaxTokenLimit(anthropicAiModel)
    );
  }
  groundTruths = await findGroundTruths(context, { taskSpecification });
  return await completions.createCompletion(
    anthropicAiModel,
    formattedSpecAndPull,
    groundTruths,
    UBIQUITY_OS_APP_NAME,
    completions.getModelMaxTokenLimit(anthropicAiModel)
  );
}

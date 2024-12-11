import { CallbackResult } from "../types/proxy";
import { Context } from "../types";
import { pullReview } from "./ask-llm";
import { hasCollaboratorConvertedPr } from "../helpers/pull-helpers/has-collaborator-converted";
import { canPerformReview } from "../helpers/pull-helpers/can-perform-review";
import { convertPullToDraft } from "../helpers/pull-helpers/convert-pull-to-draft";
import { submitCodeReview } from "../helpers/pull-helpers/submit-code-review";
import { parsePullReviewData } from "../helpers/pull-review-result-parsing";

export async function performPullPrecheck(context: Context<"pull_request.opened" | "pull_request.ready_for_review">): Promise<CallbackResult> {
  const { logger, payload } = context;
  const { pull_request } = payload;

  // Check if PR is in draft mode, closed, or if we can perform a review
  if (pull_request.draft) {
    return { status: 200, reason: logger.info("PR is in draft mode, no action required").logMessage.raw };
  } else if (pull_request.state === "closed") {
    return { status: 200, reason: logger.info("PR is closed, no action required").logMessage.raw };
  } else if (!(await canPerformReview(context))) {
    return { status: 200, reason: logger.info("Cannot perform review at this time").logMessage.raw };
  } else if (await hasCollaboratorConvertedPr(context)) {
    return { status: 200, reason: logger.info("Collaborator has converted the PR, no action required").logMessage.raw };
  }
  return await handleCodeReview(context);
}

async function handleCodeReview(context: Context<"pull_request.opened" | "pull_request.ready_for_review">): Promise<CallbackResult> {
  const { payload } = context;

  const pullReviewData = await pullReview(context);

  const { reviewComment, confidenceThreshold } = parsePullReviewData(pullReviewData.answer);

  context.logger.info(
    await convertPullToDraft(confidenceThreshold < 0.5, {
      nodeId: payload.pull_request.node_id,
      octokit: context.octokit,
    })
  );

  await submitCodeReview(context, reviewComment, confidenceThreshold > 0.5 ? "COMMENT" : "REQUEST_CHANGES");
  return { status: 200, reason: "Success" };
}

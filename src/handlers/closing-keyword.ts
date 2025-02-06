import { Context } from "../types";
import { CallbackResult } from "../types/proxy";
import { PullReviewer } from "./pull-reviewer";

/**
 * Handler for the `pull_request.edited` webhook event.
 * It checks whether the pull request body was edited and now includes a closing keyword.
 * If so, it runs the pull request precheck.
 *
 * @param context
 */
export async function handlePullRequestEditedEvent(context: Context<"pull_request.edited">): Promise<CallbackResult> {
  const { payload, logger } = context;
  const issueLinkRegex =
    /\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\b\s+(?:(?:[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+#\d+)|(?:#\d+))(?:\s*,\s*(?:(?:(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\b\s+)?(?:[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+#\d+|#\d+)))*\b/i;

  const newBody = payload.pull_request.body;
  if (!newBody) {
    return { status: 200, reason: "Pull request body is empty, Aborting" };
  }
  if (!payload.changes.body?.from) {
    return { status: 200, reason: "Pull request body wasnt edited, Skipping" };
  }

  const oldBody: string = payload.changes.body.from;

  // Find matches in both the old and new bodies
  const oldMatch = oldBody.match(issueLinkRegex);
  const newMatch = newBody.match(issueLinkRegex);

  logger.info("Pull request body edit detected", {
    oldClosingKeyword: oldMatch ? oldMatch[0] : null,
    newClosingKeyword: newMatch ? newMatch[0] : null,
  });

  if (newMatch && !oldMatch) {
    const pullReviewer = new PullReviewer(context);
    return await pullReviewer.performPullPrecheck();
  }

  return { status: 200, reason: "No new closing keyword with an issue reference detected in the PR body edit" };
}

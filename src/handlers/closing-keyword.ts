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

  const newBody = payload.pull_request.body;
  if (!newBody) {
    return { status: 200, reason: "Pull request body is empty, Aborting" };
  }
  if (!payload.changes.body?.from) {
    return { status: 200, reason: "Pull request body wasnt edited, Skipping" };
  }

  const oldBody: string = payload.changes.body.from;

  // Find matches in both the old and new bodies
  const oldMatch = extractIssueUrls(oldBody, context.payload.repository.full_name);
  const newMatch = extractIssueUrls(newBody, context.payload.repository.full_name);

  logger.info("Pull request body edit detected", {
    oldClosingKeyword: oldMatch ? oldMatch[0] : null,
    newClosingKeyword: newMatch ? newMatch[0] : null,
  });

  if (newMatch.length !== oldMatch.length || newMatch.some((url) => !oldMatch.includes(url))) {
    const pullReviewer = new PullReviewer(context);
    return await pullReviewer.performPullPrecheck();
  }
  return { status: 200, reason: "No new closing keyword with an issue reference detected in the PR body edit" };
}

function extractIssueUrls(pullBody: string, defaultRepo: string) {
  const pattern =
    /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:(https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+))|([^/\s]+\/[^#\s]+)#(\d+)|#(\d+))/gi;
  const matches = pullBody.matchAll(pattern);
  const issueUrls = [];

  for (const match of matches) {
    const fullUrl = match[1];
    const repoPath = match[4];
    const issueNum1 = match[5];
    const issueNum2 = match[6];

    if (fullUrl) {
      issueUrls.push(fullUrl);
    } else if (repoPath) {
      issueUrls.push(`https://github.com/${repoPath}/issues/${issueNum1}`);
    } else {
      issueUrls.push(`https://github.com/${defaultRepo}/issues/${issueNum2}`);
    }
  }

  return issueUrls.sort();
}

import { Context } from "../types";
import { FetchParams, Issue } from "../types/github-types";
import { TokenLimits } from "../types/llm";
import { logger } from "./errors";
import { processPullRequestDiff } from "./pull-request-parsing";

export function getIssueNumberFromPayload(payload: Context["payload"], fetchParams?: FetchParams): number {
  let issueNumber, owner, repo;
  if (!fetchParams?.issueNum) {
    if ("issue" in payload) {
      issueNumber = payload.issue.number;
    }

    if (!issueNumber && "pull_request" in payload) {
      issueNumber = payload.pull_request.number;
    }
  } else issueNumber = fetchParams.issueNum;

  // takes precedence and overrides the payload
  if (fetchParams) {
    owner = fetchParams.owner;
    repo = fetchParams.repo;
  }

  if (!issueNumber) {
    throw logger.error(`Error fetching issue`, {
      owner: owner || payload.repository.owner.login,
      repo: repo || payload.repository.name,
      issue_number: issueNumber,
    });
  }
  return issueNumber;
}

export async function fetchPullRequestDiff(context: Context, org: string, repo: string, issue: number, tokenLimits: TokenLimits) {
  const { octokit } = context;
  let diff: string;

  try {
    const diffResponse = await octokit.rest.pulls.get({
      owner: org,
      repo,
      pull_number: issue,
      mediaType: { format: "diff" },
    });

    diff = diffResponse.data as unknown as string;
  } catch (e) {
    logger.error(`Error fetching PR data`, { owner: org, repo, issue, err: String(e) });
    return { diff: null };
  }

  return await processPullRequestDiff(diff, tokenLimits);
}

export async function fetchIssue(params: FetchParams): Promise<Issue | null> {
  const { octokit, payload, logger } = params.context;
  const { owner, repo } = params;
  const issueNumber = getIssueNumberFromPayload(payload, params);

  try {
    const response = await octokit.rest.issues.get({
      owner: owner || payload.repository.owner.login,
      repo: repo || payload.repository.name,
      issue_number: issueNumber,
    });
    return response.data;
  } catch (error) {
    logger.error(`Error fetching issue`, {
      err: error,
      owner: owner || payload.repository.owner.login,
      repo: repo || payload.repository.name,
      issue_number: issueNumber,
    });
    return null;
  }
}

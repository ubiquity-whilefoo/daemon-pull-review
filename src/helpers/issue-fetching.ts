import { Context } from "../types";
import { FetchParams, Issue } from "../types/github-types";
import { logger } from "./errors";

export function getIssueNumberFromPayload(payload: Context["payload"], fetchParams?: FetchParams): number {
  let issueNumber, owner, repo;
  if (!fetchParams?.issueNum) {
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

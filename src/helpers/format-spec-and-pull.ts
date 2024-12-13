import { Context } from "../types/context";
import { TokenLimits } from "../types/llm";
import { createKey } from "../handlers/key";
import { fetchIssue } from "./issue-fetching";
import { Issue } from "../types/github-types";
import { fetchPullRequestDiff } from "./pull-helpers/fetch-diff";

export async function formatSpecAndPull(context: Context<"pull_request.opened" | "pull_request.ready_for_review">, issue: Issue): Promise<string> {
  const tokenLimits: TokenLimits = {
    modelMaxTokenLimit: context.adapters.anthropic.completions.getModelMaxTokenLimit(context.config.anthropicAiModel),
    maxCompletionTokens: context.config.maxTokens || context.adapters.anthropic.completions.getModelMaxOutputLimit(context.config.anthropicAiModel),
    runningTokenCount: 0,
    tokensRemaining: 0,
  };

  // what we start out with
  tokenLimits.tokensRemaining = tokenLimits.modelMaxTokenLimit - tokenLimits.maxCompletionTokens;

  return await createPullSpecContextBlockSection({
    context,
    tokenLimits,
    issue,
  });
}

async function createPullSpecContextBlockSection({
  context,
  tokenLimits,
  issue,
}: {
  context: Context<"pull_request.ready_for_review" | "pull_request.opened">;
  tokenLimits: TokenLimits;
  issue: Issue;
}): Promise<string> {
  const key = createKey(issue.html_url);
  const [org, repo, issueNum] = key.split("/");

  const issueNumber = parseInt(issueNum);
  if (!issueNumber || isNaN(issueNumber)) {
    throw context.logger.error("Issue number is not valid");
  }

  // Fetch our diff if we have one; this excludes the largest of files to keep within token limits
  const { diff } = await fetchPullRequestDiff(context, org, repo, context.payload.pull_request.number, tokenLimits);
  if (!diff) {
    throw context.logger.error("Error fetching the pull difference, aborting");
  }
  // specification or pull request body
  const specOrBody = (await fetchIssue(context, issueNumber))?.body || "No specification or body available";

  const specHeader = "Current Task Specification";
  const specBlock = [createHeader(specHeader, key), createSpecOrBody(specOrBody), createFooter(specHeader, key)];
  const block = [specBlock.join("\n")];

  // Build the block with the diff in it's own section
  const blockWithDiff = [block.join("\n"), createHeader(`Pull Request Diff`, key), diff, createFooter(`Pull Request Diff`, key)];
  return blockWithDiff.join("\n");
}

function createHeader(content: string, repoString: string) {
  return `=== ${content} === ${repoString} ===\n`;
}

function createFooter(content: string, repoString: string) {
  return `=== End ${content} === ${repoString} ===\n`;
}

function createSpecOrBody(specOrBody: string) {
  return `${specOrBody}\n`;
}

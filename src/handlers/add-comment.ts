import { Context } from "../types/context";
/**
 * Add a comment to an issue
 * @param context - The context object containing environment and configuration details
 * @param message - The message to add as a comment
 */

export async function addCommentToIssue(context: Context, message: string, issueNum?: number) {
  const { payload } = context;
  try {
    await context.octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: issueNum ?? context.payload.pull_request.number,
      body: message,
    });
  } catch (e: unknown) {
    context.logger.error("Adding a comment failed!", { e });
  }
}

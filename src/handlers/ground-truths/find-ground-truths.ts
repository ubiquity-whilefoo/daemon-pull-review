import { Context } from "../../types";
import { CodeReviewAppParams, CodeReviewGroundTruthSystemMessage } from "../../types/llm";
import { CODE_REVIEW_GROUND_TRUTHS_SYSTEM_MESSAGE } from "./prompts";
import { validateGroundTruths } from "./validate";
import { createGroundTruthSysMsg } from "./create-system-message";

export async function findGroundTruths(context: Context, params: CodeReviewAppParams): Promise<string[]> {
  const systemMsgObj = CODE_REVIEW_GROUND_TRUTHS_SYSTEM_MESSAGE;
  const { taskSpecification } = params;
  return findCodeReviewTruths(context, { taskSpecification }, systemMsgObj);
}

async function findCodeReviewTruths(context: Context, params: CodeReviewAppParams, systemMsgObj: CodeReviewGroundTruthSystemMessage): Promise<string[]> {
  const {
    adapters: {
      anthropic: { completions },
    },
  } = context;
  const systemMsg = createGroundTruthSysMsg(systemMsgObj);

  const truths = await completions.createGroundTruthCompletion(context, params.taskSpecification, systemMsg);
  return validateGroundTruths(truths);
}

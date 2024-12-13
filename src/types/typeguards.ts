import { CodeReviewAppParams } from "./llm";

export function codeReviewPayloadTypeguard(payload: unknown): payload is CodeReviewAppParams {
  return typeof payload === "object" && payload !== null && "taskSpecification" in payload;
}

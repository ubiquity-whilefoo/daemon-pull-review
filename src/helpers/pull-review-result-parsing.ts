import { logger } from "./errors";

function parseLooseJson<T extends object>(input: string): T {
  try {
    const fixedInput = input
      // Replace single quotes with double quotes, but not within words
      .replace(/([^a-zA-Z0-9])'([^']*)'([^a-zA-Z0-9])/g, '$1"$2"$3')
      // Quote unquoted keys
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      // Quote unquoted values, excluding numbers, booleans, and null
      .replace(/:\s*([^\s,{]+)(?=[,}])/g, (match, value) => {
        // Check if value is already valid (number, boolean, null, or quoted string)
        if (
          !isNaN(value) || // Numbers
          ["true", "false", "null"].includes(value) ||
          (value.startsWith('"') && value.endsWith('"'))
        ) {
          return match;
        }
        return `: "${value}"`;
      });

    return JSON.parse(fixedInput);
  } catch (e) {
    throw logger.error(`Failed to parse input: `, { e });
  }
}

export function parsePullReviewData(input: string) {
  try {
    const parsedInput = parseLooseJson<{ confidenceThreshold: number; reviewComment: string }>(input);
    console.error(parsedInput);
    const { confidenceThreshold: rawThreshold, reviewComment: rawComment } = parsedInput;

    if (typeof rawThreshold !== "number" && (typeof rawThreshold !== "string" || isNaN(Number(rawThreshold)))) {
      throw logger.error("Invalid or missing confidenceThreshold", parsedInput);
    }

    if (typeof rawComment !== "string") {
      throw logger.error("Invalid or missing reviewComment", parsedInput);
    }

    const confidenceThreshold = Number(rawThreshold);
    const reviewComment = rawComment;

    return { confidenceThreshold, reviewComment };
  } catch (e) {
    throw logger.error("Couldn't parse JSON output; Aborting", { e });
  }
}

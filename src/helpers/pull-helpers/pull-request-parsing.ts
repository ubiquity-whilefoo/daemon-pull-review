import { encode } from "gpt-tokenizer";
import { TokenLimits } from "../../types/llm";
import { EncodeOptions } from "gpt-tokenizer/esm/GptEncoding";
import { Context } from "../../types";
import { getExcludedFiles } from "../excluded-files";

export async function processPullRequestDiff(diff: string, tokenLimits: TokenLimits, logger: Context["logger"]) {
  const { runningTokenCount, tokensRemaining } = tokenLimits;

  // parse the diff into per-file diffs for quicker processing
  const excludedFiles = await getExcludedFiles();
  const perFileDiffs = parsePerFileDiffs(diff).filter((file) => excludedFiles.some((excludedFile) => !file.filename.startsWith(excludedFile)));

  const accurateFileDiffStats = await Promise.all(
    perFileDiffs.map(async (file) => {
      const tokenCountArray = await encodeAsync(file.diffContent, { disallowedSpecial: new Set() });
      const tokenCount = tokenCountArray.length;
      return { filename: file.filename, tokenCount, diffContent: file.diffContent };
    })
  );

  // Sort by token count to process smallest files first
  accurateFileDiffStats.sort((a, b) => a.tokenCount - b.tokenCount);

  let currentTokenCount = runningTokenCount;
  const includedFileDiffs = [];

  // Include files until we reach the token limit
  for (const file of accurateFileDiffStats) {
    if (currentTokenCount + file.tokenCount > tokensRemaining) {
      logger.info(`Skipping ${file.filename} to stay within token limits.`);
      continue;
    }
    includedFileDiffs.push(file);
    currentTokenCount += file.tokenCount;
  }

  // If no files can be included, return null
  if (includedFileDiffs.length === 0) {
    logger.error(`Cannot include any files from diff without exceeding token limits.`);
    return { diff: null };
  }

  // Recalculate the current token count after including the files
  currentTokenCount = includedFileDiffs.reduce((sum, file) => sum + file.tokenCount, runningTokenCount);

  // Remove files from the end of the list until we are within token limits
  while (currentTokenCount > tokensRemaining && includedFileDiffs.length > 0) {
    const removedFile = includedFileDiffs.pop();
    currentTokenCount -= removedFile?.tokenCount || 0;
    logger.info(`Excluded ${removedFile?.filename || "Unknown filename"} after accurate token count exceeded limits.`);
  }

  if (includedFileDiffs.length === 0) {
    logger.error(`Cannot include any files from diff after accurate token count calculation.`);
    return { diff: null };
  }

  // Build the diff with the included files
  const currentDiff = includedFileDiffs.map((file) => file.diffContent).join("\n");

  return { diff: currentDiff };
}

// Helper to speed up tokenization
async function encodeAsync(text: string, options: EncodeOptions): Promise<number[]> {
  return new Promise((resolve) => {
    const result = encode(text, options);
    resolve(result);
  });
}

// Helper to parse a diff into per-file diffs
function parsePerFileDiffs(diff: string): { filename: string; diffContent: string }[] {
  // regex to capture diff sections, including the last file
  const diffPattern = /^diff --git a\/(.*?) b\/.*$/gm;
  let match: RegExpExecArray | null;
  const perFileDiffs = [];
  let lastIndex = 0;

  // iterate over each file in the diff
  while ((match = diffPattern.exec(diff)) !== null) {
    const filename = match[1];
    const startIndex = match.index;

    // if we have pushed a file into the array, "append" the diff content
    if (perFileDiffs.length > 0) {
      perFileDiffs[perFileDiffs.length - 1].diffContent = diff.substring(lastIndex, startIndex).trim();
    }

    perFileDiffs.push({ filename, diffContent: "" });
    lastIndex = startIndex;
  }
  // append the last file's diff content
  if (perFileDiffs.length > 0 && lastIndex < diff.length) {
    perFileDiffs[perFileDiffs.length - 1].diffContent = diff.substring(lastIndex).trim();
  }

  return perFileDiffs;
}

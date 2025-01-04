import { encode } from "gpt-tokenizer";
import { TokenLimits } from "../../types/llm";
import { EncodeOptions } from "gpt-tokenizer/esm/GptEncoding";
import { Context } from "../../types";
import { getExcludedFiles } from "../excluded-files";
import { minimatch } from "minimatch";

async function filterAndSortDiffs(diff: string, excludedPatterns: string[]): Promise<{ filename: string; tokenCount: number; diffContent: string }[]> {
  const perFileDiffs = parsePerFileDiffs(diff).filter((file) => excludedPatterns.every((pattern) => !minimatch(file.filename, pattern)));

  const accurateFileDiffStats = await Promise.all(
    perFileDiffs.map(async (file) => {
      const tokenCountArray = await encodeAsync(file.diffContent, { disallowedSpecial: new Set() });
      return { filename: file.filename, tokenCount: tokenCountArray.length, diffContent: file.diffContent };
    })
  );

  // Sort files by token count in ascending order
  return accurateFileDiffStats.sort((a, b) => a.tokenCount - b.tokenCount);
}

function selectIncludedFiles(
  files: { filename: string; tokenCount: number; diffContent: string }[],
  tokenLimits: TokenLimits,
  logger: Context["logger"]
): typeof files {
  const { runningTokenCount, tokensRemaining } = tokenLimits;
  let currentTokenCount = runningTokenCount;
  const includedFiles = [];

  for (const file of files) {
    if (currentTokenCount + file.tokenCount > tokensRemaining) {
      logger.info(`Skipping ${file.filename} to stay within token limits.`);
      continue;
    }
    includedFiles.push(file);
    currentTokenCount += file.tokenCount;
  }

  return includedFiles;
}

export async function processPullRequestDiff(diff: string, tokenLimits: TokenLimits, logger: Context["logger"]) {
  const excludedFilePatterns = await getExcludedFiles();
  const sortedDiffs = await filterAndSortDiffs(diff, excludedFilePatterns);

  const includedFiles = selectIncludedFiles(sortedDiffs, tokenLimits, logger);

  if (includedFiles.length === 0) {
    logger.error(`Cannot include any files from diff without exceeding token limits.`);
    return { diff: null };
  }

  // Build and return the final diff
  const currentDiff = includedFiles.map((file) => file.diffContent).join("\n");
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

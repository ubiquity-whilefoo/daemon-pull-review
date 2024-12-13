import { logger } from "./errors";

export function parseLooseJson<T extends object>(input: string): T {
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

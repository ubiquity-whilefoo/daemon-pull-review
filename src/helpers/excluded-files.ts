import { Context } from "../types";

interface GitAttributes {
  pattern: string;
  attributes: { [key: string]: string | boolean };
}

async function parseGitAttributes(content: string): Promise<GitAttributes[]> {
  const lines = content.split("\n");
  return lines
    .map((line) => {
      line = line.trim();
      if (!line || line.startsWith("#")) return null;

      const parts = line.split(/\s+/);
      if (parts.length < 2) return null;

      const pattern = parts[0];
      const attributes: { [key: string]: string | boolean } = {};

      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i];
        if (attr.includes("=")) {
          const [key, value] = attr.split("=");
          attributes[key.trim()] = value.trim();
        } else {
          attributes[attr.trim()] = true;
        }
      }

      return { pattern, attributes };
    })
    .filter((item): item is GitAttributes => item !== null);
}

export async function getExcludedFiles(context: Context) {
  const [gitIgnoreContent, gitAttributesContent] = await Promise.all([getFileContent(".gitignore", context), getFileContent(".gitattributes", context)]);

  const gitAttributesLinguistGenerated = (await parseGitAttributes(gitAttributesContent))
    .filter((v) => v.attributes["linguist-generated"])
    .map((v) => v.pattern);
  const gitIgnoreExcludedFiles = gitIgnoreContent.split("\n").filter((v) => !v.startsWith("#"));
  return [...gitAttributesLinguistGenerated, ...gitIgnoreExcludedFiles];
}

async function getFileContent(path: string, context: Context): Promise<string> {
  try {
    const response = await context.octokit.rest.repos.getContent({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      path,
      ref: context.payload.pull_request.head.sha,
    });

    // GitHub API returns content as base64
    if ("content" in response.data && !Array.isArray(response.data)) {
      return Buffer.from(response.data.content, "base64").toString("utf-8");
    }
    return "";
  } catch {
    // File doesn't exist
    return "";
  }
}

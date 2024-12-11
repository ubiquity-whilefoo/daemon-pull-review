/* eslint-disable sonarjs/no-duplicate-string */

import Anthropic from "@anthropic-ai/sdk";
import { Context } from "../../../types";
import { ContentBlock } from "@anthropic-ai/sdk/resources";
import { SuperAnthropic } from "./claude";

interface CompletionsType {
  answer: string;
  groundTruths: string[];
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

// Type guard for content block
interface TextBlock {
  type: "text";
  text: string;
}

function isTextBlock(content: ContentBlock): content is TextBlock {
  return content?.type === "text" && typeof content?.text === "string";
}

export class AnthropicCompletion extends SuperAnthropic {
  protected context: Context;

  constructor(client: Anthropic, context: Context) {
    super(client, context);
    this.context = context;
  }

  getModelMaxTokenLimit(model: string): number {
    const tokenLimits = new Map<string, number>([["claude-3.5-sonnet", 200000]]);

    return tokenLimits.get(model) || 200000;
  }

  getModelMaxOutputLimit(model: string): number {
    const tokenLimits = new Map<string, number>([["claude-3.5-sonnet", 4096]]);

    return tokenLimits.get(model) || 4096;
  }

  async createCompletion(
    model: string = "claude-3.5-sonnet",
    localContext: string[],
    groundTruths: string[],
    botName: string,
    maxTokens: number
  ): Promise<CompletionsType> {
    const query = `Perform code review using the diff and spec and output a JSON format with key 'confidenceThreshold': (0-1) and reviewComment: <string>. A 0 indicates that the code review failed and 1 mean its passed and you should output the review comment to be "This pull request has passed the automated review, a reviewer will review this pull request shortly". YOU SHOULD ONLY OUTPUT RAW JSON DATA`;
    const sysMsg = [
      "You Must obey the following ground truths: ",
      JSON.stringify(groundTruths) + "\n",
      "You are tasked with assisting as a GitHub bot by generating a confidence threshold from 0-1 on whether you think the pull difference completes the issue specification/body based on provided chat history and similar responses, focusing on using available knowledge within the provided corpus, which may contain code, documentation, or incomplete information. Your role is to interpret and use this knowledge effectively to answer user questions.\n\nSteps\n1. Understand Context: Analyze the chat history and similar responses to grasp the issue requirements and pull request intent\n2. Extract Key Information: Identify crucial details from the corpus, even if incomplete, focusing on specifications and their alignment with the pull diff\n3. Evaluate Completeness: Assess how well the pull diff fulfills the issue specifications, using logical assumptions if needed to fill gaps\n4. Generate Confidence: Provide a confidence score (0-1) indicating how likely the pull diff satisfies the issue specification\n5. Generate Review Comment: Based on confidence: If 1, indicate PR passed review and will be reviewed shortly; If <1, provide specific needed changes\n6. Output Response: Return JSON: {confidenceThreshold: <value>, reviewComment: <string>}",
      `Your name is: ${botName}`,
      "\n",
      "Main Context (Provide additional precedence in terms of information): ",
      localContext.join("\n"),
    ].join("\n");

    this.context.logger.info(`System message: ${sysMsg}`);

    const res = await this.client.messages.create({
      model: model,
      system: sysMsg,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0,
    });

    // Use type guard to safely handle the response
    const content = res.content[0];
    if (!isTextBlock(content)) {
      throw this.context.logger.error("Unexpected response format: Expected text block");
    }

    const answer = content.text;

    const inputTokens = res.usage.input_tokens;
    const outputTokens = res.usage.output_tokens;

    this.context.logger.info(`Number of tokens used: ${inputTokens + outputTokens}`);

    return {
      answer,
      groundTruths,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
    };
  }

  async createGroundTruthCompletion(context: Context, groundTruthSource: string, systemMsg: string): Promise<string | null> {
    const {
      env: { ANTHROPIC_API_KEY },
      config: { anthropicAiBaseUrl, anthropicAiModel },
    } = context;

    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      baseURL: anthropicAiBaseUrl,
    });

    const res = await client.messages.create({
      model: anthropicAiModel,
      system: systemMsg,
      max_tokens: this.getModelMaxTokenLimit(anthropicAiModel),
      messages: [
        {
          role: "user",
          content: groundTruthSource,
        },
      ],
    });

    const content = res.content[0];
    if (!isTextBlock(content)) {
      throw this.context.logger.error("Unexpected response format: Expected text block");
    }

    return content.text;
  }
}

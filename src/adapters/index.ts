import { Context } from "../types";
import { AnthropicCompletion } from "./claude/helpers/completions";
import Anthropic from "@anthropic-ai/sdk";
import { SuperAnthropic } from "./claude/helpers/claude";

export function createAdapters(anthropic: Anthropic, context: Context) {
  return {
    anthropic: {
      completions: new AnthropicCompletion(anthropic, context),
      super: new SuperAnthropic(anthropic, context),
    },
  };
}

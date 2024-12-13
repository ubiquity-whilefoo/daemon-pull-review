import Anthropic from "@anthropic-ai/sdk";
import { Context } from "./types/context";
import { createAdapters } from "./adapters";
import { callCallbacks } from "./helpers/callback-proxy";

export async function plugin(context: Context) {
  const { env, config } = context;

  const anthropicAiObject = {
    apiKey: env.ANTHROPIC_API_KEY,
    ...(config.anthropicAiBaseUrl && { baseURL: config.anthropicAiBaseUrl }),
  };
  const anthropicAiClient = new Anthropic(anthropicAiObject);
  context.adapters = createAdapters(anthropicAiClient, context);

  return await callCallbacks(context, context.eventName);
}

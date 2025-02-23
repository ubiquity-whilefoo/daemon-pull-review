import { StaticDecode, Type as T } from "@sinclair/typebox";
import ms from "ms";
/**
 * This should contain the properties of the bot config
 * that are required for the plugin to function.
 *
 * The kernel will extract those and pass them to the plugin,
 * which are built into the context object from setup().
 */

export const pluginSettingsSchema = T.Object(
  {
    openRouterAiModel: T.String({ default: "anthropic/claude-3.5-sonnet", description: "The model to use for OpenRouter AI", examples: ["anthropic/claude-3.5-sonnet"] }),
    openRouterBaseUrl: T.String({ default: "https://openrouter.ai/api/v1", description: "The base URL for OpenRouter AI", examples: ["https://openrouter.ai/api/v1"] }),
    tokenLimit: T.Object(
      {
        context: T.Number({ default: 200000 }),
        completion: T.Number({ default: 4096 }),
      },
      { default: {}, description: "The token limits for LLM context and completion", examples: [{ context: 200000, completion: 4096 }] }
    ),
    reviewInterval: T.Transform(T.Optional(T.String({ default: "1 Day", description: "How often a review can be performed. Omit for no limit", examples: ["1 Day", "1 Hour", "1 Week"] })),)
      .Decode((v: string) => {
        try {
          const val = ms(v as unknown as number, { long: false }) as unknown as number;
          if (!val || isNaN(Number(val))) throw new Error("Invalid value");
          return val;
        } catch {
          if (v.includes("push")) return null;
        }
      })
      .Encode((v) => {
        if (!v) return "push";
        return ms(v, { long: true });
      }),
  },
  { default: {} }
);

export type PluginSettings = StaticDecode<typeof pluginSettingsSchema>;

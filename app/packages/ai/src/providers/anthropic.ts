/**
 * Anthropic Provider
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import type { ProviderConfig, ChatMessage, CompletionOptions, CompletionResult } from "../types.js";

export function createAnthropicProvider(config: ProviderConfig = {}) {
  const anthropic = createAnthropic({
    apiKey: config.apiKey || process.env["ANTHROPIC_API_KEY"],
    baseURL: config.baseUrl,
  });

  const defaultModel = config.defaultModel || "claude-sonnet-4-20250514";

  return {
    name: "anthropic" as const,

    async complete(
      messages: ChatMessage[],
      options: CompletionOptions = {}
    ): Promise<CompletionResult> {
      const model = options.model || defaultModel;

      const result = await generateText({
        model: anthropic(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens || 4096,
        topP: options.topP,
        stopSequences: options.stop,
      });

      return {
        content: result.text,
        provider: "anthropic",
        model,
        usage: {
          promptTokens: result.usage?.promptTokens ?? 0,
          completionTokens: result.usage?.completionTokens ?? 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
        finishReason: result.finishReason,
      };
    },

    async *stream(
      messages: ChatMessage[],
      options: CompletionOptions = {}
    ): AsyncGenerator<{ content: string; done: boolean }> {
      const model = options.model || defaultModel;

      const result = streamText({
        model: anthropic(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens || 4096,
        topP: options.topP,
        stopSequences: options.stop,
      });

      for await (const chunk of result.textStream) {
        yield { content: chunk, done: false };
      }
      yield { content: "", done: true };
    },
  };
}

export type AnthropicProvider = ReturnType<typeof createAnthropicProvider>;

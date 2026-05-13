/**
 * OpenAI Provider
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, embed } from "ai";
import type {
  ProviderConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  EmbeddingResult,
} from "../types.js";

export function createOpenAIProvider(config: ProviderConfig = {}) {
  const openai = createOpenAI({
    apiKey: config.apiKey || process.env["OPENAI_API_KEY"],
    baseURL: config.baseUrl,
  });

  const defaultModel = config.defaultModel || "gpt-4o";

  return {
    name: "openai" as const,

    async complete(
      messages: ChatMessage[],
      options: CompletionOptions = {}
    ): Promise<CompletionResult> {
      const model = options.model || defaultModel;

      const result = await generateText({
        model: openai(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
        stopSequences: options.stop,
      });

      return {
        content: result.text,
        provider: "openai",
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
        model: openai(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
        stopSequences: options.stop,
      });

      for await (const chunk of result.textStream) {
        yield { content: chunk, done: false };
      }
      yield { content: "", done: true };
    },

    async embed(text: string, model = "text-embedding-3-small"): Promise<EmbeddingResult> {
      const result = await embed({
        model: openai.embedding(model),
        value: text,
      });

      return {
        embedding: result.embedding,
        provider: "openai",
        model,
      };
    },

    async embedMany(texts: string[], model = "text-embedding-3-small"): Promise<EmbeddingResult[]> {
      const results = await Promise.all(texts.map((text) => this.embed(text, model)));
      return results;
    },
  };
}

export type OpenAIProvider = ReturnType<typeof createOpenAIProvider>;

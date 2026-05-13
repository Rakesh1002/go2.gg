/**
 * Google AI Provider
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, embed } from "ai";
import type {
  ProviderConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  EmbeddingResult,
} from "../types.js";

export function createGoogleProvider(config: ProviderConfig = {}) {
  const google = createGoogleGenerativeAI({
    apiKey: config.apiKey || process.env["GOOGLE_AI_API_KEY"],
    baseURL: config.baseUrl,
  });

  const defaultModel = config.defaultModel || "gemini-2.0-flash-exp";

  return {
    name: "google" as const,

    async complete(
      messages: ChatMessage[],
      options: CompletionOptions = {}
    ): Promise<CompletionResult> {
      const model = options.model || defaultModel;

      const result = await generateText({
        model: google(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        stopSequences: options.stop,
      });

      return {
        content: result.text,
        provider: "google",
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
        model: google(model),
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        stopSequences: options.stop,
      });

      for await (const chunk of result.textStream) {
        yield { content: chunk, done: false };
      }
      yield { content: "", done: true };
    },

    async embed(text: string, model = "text-embedding-004"): Promise<EmbeddingResult> {
      const result = await embed({
        model: google.textEmbeddingModel(model),
        value: text,
      });

      return {
        embedding: result.embedding,
        provider: "google",
        model,
      };
    },
  };
}

export type GoogleProvider = ReturnType<typeof createGoogleProvider>;

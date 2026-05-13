/**
 * AI Package Types
 */

export type AIProvider = "openai" | "anthropic" | "google" | "groq" | "ollama" | "deepseek";

export type RoutingStrategy = "fallback" | "round-robin" | "cost-optimized" | "latency-optimized";

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
  models?: string[];
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface AIRouterConfig {
  providers: Partial<Record<AIProvider, ProviderConfig>>;
  strategy: RoutingStrategy;
  defaultProvider: AIProvider;
  defaultModel?: string;
  fallbackProviders?: AIProvider[];
  maxRetries?: number;
  timeout?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

export interface CompletionOptions {
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface EmbeddingOptions {
  model?: string;
  provider?: AIProvider;
}

export interface CompletionResult {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  provider: AIProvider;
  model: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

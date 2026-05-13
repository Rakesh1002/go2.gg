/**
 * AI Router
 *
 * Intelligent routing between multiple AI providers with fallback support.
 */

import { createOpenAIProvider } from "./providers/openai.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createGoogleProvider } from "./providers/google.js";
import type {
  AIProvider,
  AIRouterConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  EmbeddingResult,
  ProviderConfig,
} from "./types.js";

type ProviderInstance =
  | ReturnType<typeof createOpenAIProvider>
  | ReturnType<typeof createAnthropicProvider>
  | ReturnType<typeof createGoogleProvider>;

export class AIRouter {
  private providers: Map<AIProvider, ProviderInstance> = new Map();
  private config: AIRouterConfig;
  private currentProviderIndex = 0;
  private providerOrder: AIProvider[];

  constructor(config: AIRouterConfig) {
    this.config = config;
    this.providerOrder = Object.keys(config.providers) as AIProvider[];
    this.initializeProviders();
  }

  private initializeProviders() {
    const { providers } = this.config;

    if (
      providers.openai?.enabled !== false &&
      (providers.openai?.apiKey || process.env["OPENAI_API_KEY"])
    ) {
      this.providers.set("openai", createOpenAIProvider(providers.openai));
    }

    if (
      providers.anthropic?.enabled !== false &&
      (providers.anthropic?.apiKey || process.env["ANTHROPIC_API_KEY"])
    ) {
      this.providers.set("anthropic", createAnthropicProvider(providers.anthropic));
    }

    if (
      providers.google?.enabled !== false &&
      (providers.google?.apiKey || process.env["GOOGLE_AI_API_KEY"])
    ) {
      this.providers.set("google", createGoogleProvider(providers.google));
    }
  }

  private getProvider(preferredProvider?: AIProvider): ProviderInstance {
    // If specific provider requested and available, use it
    if (preferredProvider && this.providers.has(preferredProvider)) {
      return this.providers.get(preferredProvider)!;
    }

    // Get provider based on strategy
    switch (this.config.strategy) {
      case "round-robin":
        return this.getRoundRobinProvider();
      case "fallback":
      default:
        return this.getFallbackProvider();
    }
  }

  private getFallbackProvider(): ProviderInstance {
    // Try default provider first
    if (this.providers.has(this.config.defaultProvider)) {
      return this.providers.get(this.config.defaultProvider)!;
    }

    // Try fallback providers
    for (const provider of this.config.fallbackProviders || []) {
      if (this.providers.has(provider)) {
        return this.providers.get(provider)!;
      }
    }

    // Return first available provider
    const firstProvider = this.providers.values().next().value;
    if (!firstProvider) {
      throw new Error("No AI providers available");
    }
    return firstProvider;
  }

  private getRoundRobinProvider(): ProviderInstance {
    const availableProviders = Array.from(this.providers.values());
    if (availableProviders.length === 0) {
      throw new Error("No AI providers available");
    }

    const provider = availableProviders[this.currentProviderIndex];
    this.currentProviderIndex = (this.currentProviderIndex + 1) % availableProviders.length;
    return provider;
  }

  /**
   * Generate a completion with automatic provider routing.
   */
  async complete(
    messages: ChatMessage[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    const provider = this.getProvider(options.provider);
    const maxRetries = this.config.maxRetries ?? 2;

    let lastError: Error | undefined;
    const providersToTry = [provider];

    // Add fallback providers for retry attempts
    if (this.config.strategy === "fallback") {
      for (const fallback of this.config.fallbackProviders || []) {
        const fallbackProvider = this.providers.get(fallback);
        if (fallbackProvider && fallbackProvider !== provider) {
          providersToTry.push(fallbackProvider);
        }
      }
    }

    for (let i = 0; i < Math.min(maxRetries + 1, providersToTry.length); i++) {
      const currentProvider = providersToTry[i];
      try {
        return await currentProvider.complete(messages, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Provider ${currentProvider.name} failed:`, lastError.message);
      }
    }

    throw lastError || new Error("All providers failed");
  }

  /**
   * Stream a completion with automatic provider routing.
   */
  async *stream(
    messages: ChatMessage[],
    options: CompletionOptions = {}
  ): AsyncGenerator<{ content: string; done: boolean }> {
    const provider = this.getProvider(options.provider);
    yield* provider.stream(messages, options);
  }

  /**
   * Generate embeddings using the specified or default provider.
   */
  async embed(
    text: string,
    options?: { provider?: AIProvider; model?: string }
  ): Promise<EmbeddingResult> {
    const providerName = options?.provider || this.config.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider || !("embed" in provider)) {
      // Fall back to OpenAI for embeddings
      const openai = this.providers.get("openai");
      if (openai && "embed" in openai) {
        return openai.embed(text, options?.model);
      }
      throw new Error(`Provider ${providerName} does not support embeddings`);
    }

    return (provider as ReturnType<typeof createOpenAIProvider>).embed(text, options?.model);
  }

  /**
   * Check which providers are available.
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a specific provider is available.
   */
  hasProvider(provider: AIProvider): boolean {
    return this.providers.has(provider);
  }
}

/**
 * Create an AI router with the given configuration.
 */
export function createAIRouter(config: Partial<AIRouterConfig> = {}): AIRouter {
  const fullConfig: AIRouterConfig = {
    providers: config.providers || {
      openai: {},
      anthropic: {},
      google: {},
    },
    strategy: config.strategy || "fallback",
    defaultProvider: config.defaultProvider || "openai",
    defaultModel: config.defaultModel,
    fallbackProviders: config.fallbackProviders || ["anthropic", "google"],
    maxRetries: config.maxRetries ?? 2,
    timeout: config.timeout ?? 30000,
  };

  return new AIRouter(fullConfig);
}

// Convenience function for quick usage
let defaultRouter: AIRouter | null = null;

export function getDefaultRouter(): AIRouter {
  if (!defaultRouter) {
    defaultRouter = createAIRouter();
  }
  return defaultRouter;
}

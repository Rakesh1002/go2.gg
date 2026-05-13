/**
 * ShipQuest AI Package
 *
 * Multi-provider AI routing, RAG, chat, and agents.
 *
 * This is a PREMIUM feature that requires a ShipQuest license.
 * Get your license at: https://shipquest.dev/buy
 */

import { gatePremiumFeature } from "@repo/config";

// Gate this entire package as premium
gatePremiumFeature("ai");

// Core router
export { AIRouter, createAIRouter, getDefaultRouter } from "./router.js";

// Types
export type {
  AIProvider,
  AIRouterConfig,
  ProviderConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  EmbeddingOptions,
  EmbeddingResult,
  RoutingStrategy,
  StreamChunk,
} from "./types.js";

// Re-export providers
export * from "./providers/index.js";

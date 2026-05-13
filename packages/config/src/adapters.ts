/**
 * Adapter Configuration
 *
 * This module defines the adapter pattern for swapping implementations.
 * All major services (auth, db, payments, analytics) are abstracted behind adapters.
 *
 * Philosophy:
 * - No vendor lock-in: every service can be replaced
 * - Configuration via environment: adapters are selected at startup
 * - Type-safe: adapter interfaces are strictly typed
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Adapter Type Definitions
// -----------------------------------------------------------------------------

export const AuthProviders = ["better-auth", "custom"] as const;
export type AuthProvider = (typeof AuthProviders)[number];

export const DbProviders = ["d1"] as const;
export type DbProvider = (typeof DbProviders)[number];

export const PaymentProviders = ["stripe", "none"] as const;
export type PaymentProvider = (typeof PaymentProviders)[number];

export const AnalyticsProviders = ["posthog", "none"] as const;
export type AnalyticsProvider = (typeof AnalyticsProviders)[number];

export const RateLimitProviders = ["durable-object", "memory", "none"] as const;
export type RateLimitProvider = (typeof RateLimitProviders)[number];

export const StorageProviders = ["r2", "none"] as const;
export type StorageProvider = (typeof StorageProviders)[number];

// -----------------------------------------------------------------------------
// Adapter Configuration Schema
// -----------------------------------------------------------------------------

export const adapterConfigSchema = z.object({
  auth: z.enum(AuthProviders),
  db: z.enum(DbProviders),
  payments: z.enum(PaymentProviders),
  analytics: z.enum(AnalyticsProviders),
  rateLimit: z.enum(RateLimitProviders),
  storage: z.enum(StorageProviders).default("r2"),
});

export type AdapterConfig = z.infer<typeof adapterConfigSchema>;

// -----------------------------------------------------------------------------
// Adapter Factory Types
// -----------------------------------------------------------------------------

/**
 * Generic adapter interface.
 * All adapters must implement initialization and cleanup.
 */
export interface BaseAdapter {
  readonly name: string;
  readonly provider: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * Factory function type for creating adapters.
 * Each adapter type has its own factory that takes relevant config.
 */
export type AdapterFactory<TAdapter extends BaseAdapter, TConfig = unknown> = (
  config: TConfig
) => TAdapter;

// -----------------------------------------------------------------------------
// Adapter Resolution
// -----------------------------------------------------------------------------

/**
 * Creates the adapter configuration from environment.
 * This is the single source of truth for which adapters are active.
 */
export function createAdapterConfig(env: {
  AUTH_PROVIDER?: string;
  DB_PROVIDER?: string;
  PAYMENT_PROVIDER?: string;
  ANALYTICS_PROVIDER?: string;
  RATE_LIMIT_PROVIDER?: string;
  STORAGE_PROVIDER?: string;
}): AdapterConfig {
  return adapterConfigSchema.parse({
    auth: env.AUTH_PROVIDER ?? "better-auth",
    db: env.DB_PROVIDER ?? "d1",
    payments: env.PAYMENT_PROVIDER ?? "stripe",
    analytics: env.ANALYTICS_PROVIDER ?? "posthog",
    rateLimit: env.RATE_LIMIT_PROVIDER ?? "durable-object",
    storage: env.STORAGE_PROVIDER ?? "r2",
  });
}

/**
 * Type guard to check if a specific adapter is enabled.
 */
export function isAdapterEnabled<T extends keyof AdapterConfig>(
  config: AdapterConfig,
  key: T,
  value: AdapterConfig[T]
): boolean {
  return config[key] === value;
}

/**
 * Helper to check if payments are enabled.
 */
export function isPaymentsEnabled(config: AdapterConfig): boolean {
  return config.payments !== "none";
}

/**
 * Helper to check if analytics are enabled.
 */
export function isAnalyticsEnabled(config: AdapterConfig): boolean {
  return config.analytics !== "none";
}

/**
 * Helper to check if rate limiting is enabled.
 */
export function isRateLimitEnabled(config: AdapterConfig): boolean {
  return config.rateLimit !== "none";
}

// -----------------------------------------------------------------------------
// Adapter Registry (for runtime adapter management)
// -----------------------------------------------------------------------------

type AdapterRegistry = Map<string, BaseAdapter>;

const globalRegistry: AdapterRegistry = new Map();

/**
 * Register an adapter instance.
 * Used for dependency injection and cleanup.
 */
export function registerAdapter(key: string, adapter: BaseAdapter): void {
  if (globalRegistry.has(key)) {
    console.warn(`Adapter "${key}" already registered. Overwriting.`);
  }
  globalRegistry.set(key, adapter);
}

/**
 * Get a registered adapter by key.
 */
export function getAdapter<T extends BaseAdapter>(key: string): T | undefined {
  return globalRegistry.get(key) as T | undefined;
}

/**
 * Cleanup all registered adapters.
 * Call this during graceful shutdown.
 */
export async function destroyAllAdapters(): Promise<void> {
  const destroyPromises = Array.from(globalRegistry.values()).map((adapter) =>
    adapter.destroy().catch((err) => {
      console.error(`Failed to destroy adapter ${adapter.name}:`, err);
    })
  );

  await Promise.all(destroyPromises);
  globalRegistry.clear();
}

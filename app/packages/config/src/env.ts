/**
 * Environment Variable Schema & Validation
 *
 * This module provides type-safe environment variable access with Zod validation.
 * All environment variables must be defined here with their expected types.
 *
 * Architecture Decision:
 * - We validate at build time for Next.js (via next.config.ts)
 * - We validate at startup for Hono workers (via bindings)
 * - Runtime access is always typed and validated
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Schema Definitions
// -----------------------------------------------------------------------------

/**
 * Server-side environment variables (never exposed to client)
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Adapter selection
  AUTH_PROVIDER: z.enum(["better-auth", "custom"]).default("better-auth"),
  DB_PROVIDER: z.enum(["d1"]).default("d1"),
  PAYMENT_PROVIDER: z.enum(["stripe", "none"]).default("stripe"),
  ANALYTICS_PROVIDER: z.enum(["posthog", "none"]).default("posthog"),
  RATE_LIMIT_PROVIDER: z.enum(["durable-object", "memory", "none"]).default("durable-object"),

  // Cloudflare
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_D1_DATABASE_ID: z.string().optional(),
  CLOUDFLARE_D1_DATABASE_NAME: z.string().default("shipquest-db"),
  CLOUDFLARE_KV_NAMESPACE_ID: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),

  // Supabase (server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_STARTER: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),

  // PostHog (server-side)
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Security
  CSRF_SECRET: z.string().min(32).optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

/**
 * Client-side environment variables (exposed via NEXT_PUBLIC_ prefix)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8787"),

  // Supabase (client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Stripe (client-side)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // PostHog (client-side)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),

  // Turnstile (client-side)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

/**
 * Feature flags (can be overridden at runtime)
 */
const featureFlagsSchema = z.object({
  FEATURE_MAINTENANCE_MODE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  FEATURE_ENABLE_SIGNUP: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  FEATURE_ENABLE_OAUTH_GOOGLE: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  FEATURE_ENABLE_OAUTH_GITHUB: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  FEATURE_ENABLE_MAGIC_LINK: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
});

// Combined schema for full validation
const envSchema = serverEnvSchema.merge(clientEnvSchema).merge(featureFlagsSchema);

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type Env = z.infer<typeof envSchema>;

// -----------------------------------------------------------------------------
// Validation & Access
// -----------------------------------------------------------------------------

/**
 * Validates environment variables and returns typed config.
 * Call this at application startup to fail fast on misconfiguration.
 *
 * @param rawEnv - The raw environment object (process.env or Cloudflare bindings)
 * @returns Validated and typed environment configuration
 * @throws ZodError if validation fails
 */
export function validateEnv(rawEnv: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Invalid environment variables:", formatted);
    throw new Error("Invalid environment configuration. Check the logs above.");
  }

  return result.data;
}

/**
 * Validates only client-side environment variables.
 * Safe to use in browser context.
 */
export function validateClientEnv(rawEnv: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error("Invalid client environment configuration.");
  }

  return result.data;
}

/**
 * Validates only server-side environment variables.
 * Use this in API routes and server components.
 */
export function validateServerEnv(rawEnv: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error("Invalid server environment configuration.");
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Lazy Singleton (for Next.js usage)
// -----------------------------------------------------------------------------

let cachedEnv: Env | null = null;

/**
 * Returns the validated environment config.
 * Caches the result for subsequent calls.
 *
 * Note: In Cloudflare Workers, use validateEnv(bindings) directly
 * since process.env doesn't work the same way.
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  // Only access process.env in Node.js environment
  if (typeof process !== "undefined" && process.env) {
    cachedEnv = validateEnv(process.env as Record<string, string | undefined>);
    return cachedEnv;
  }

  throw new Error("Environment not available. Use validateEnv() with bindings in Workers.");
}

/**
 * Client-safe environment access.
 * Only returns NEXT_PUBLIC_ prefixed variables.
 */
export function getClientEnv(): ClientEnv {
  if (typeof window === "undefined") {
    // Server-side: extract from full env
    const env = getEnv();
    return {
      NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_POSTHOG_KEY: env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    };
  }

  // Client-side: Next.js inlines these at build time
  return validateClientEnv({
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    NEXT_PUBLIC_POSTHOG_KEY: process.env["NEXT_PUBLIC_POSTHOG_KEY"],
    NEXT_PUBLIC_POSTHOG_HOST: process.env["NEXT_PUBLIC_POSTHOG_HOST"],
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
  });
}

// Re-export schemas for use in other packages
export { serverEnvSchema, clientEnvSchema, featureFlagsSchema, envSchema };

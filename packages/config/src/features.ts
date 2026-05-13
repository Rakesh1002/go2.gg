/**
 * Feature Flags Configuration
 *
 * Runtime feature flag system with support for:
 * - Environment variables
 * - KV storage (Cloudflare)
 * - PostHog feature flags
 */

import { z } from "zod";

// Feature flag definitions
export const featureFlagDefinitions = {
  FEATURE_MAINTENANCE_MODE: {
    description: "Enable maintenance mode",
    defaultValue: false,
    clientSafe: true,
  },
  FEATURE_ENABLE_SIGNUP: {
    description: "Allow new user signups",
    defaultValue: true,
    clientSafe: true,
  },
  FEATURE_ENABLE_OAUTH_GOOGLE: {
    description: "Enable Google OAuth",
    defaultValue: true,
    clientSafe: true,
  },
  FEATURE_ENABLE_OAUTH_GITHUB: {
    description: "Enable GitHub OAuth",
    defaultValue: true,
    clientSafe: true,
  },
  FEATURE_ENABLE_MAGIC_LINK: {
    description: "Enable magic link authentication",
    defaultValue: true,
    clientSafe: true,
  },
  FEATURE_ENABLE_SUBSCRIPTIONS: {
    description: "Enable subscription features",
    defaultValue: true,
    clientSafe: true,
  },
  FEATURE_ENABLE_USAGE_BASED_BILLING: {
    description: "Enable usage-based billing",
    defaultValue: false,
    clientSafe: false,
  },
  FEATURE_ENABLE_NEW_DASHBOARD: {
    description: "Enable new dashboard UI",
    defaultValue: false,
    clientSafe: true,
  },
  FEATURE_ENABLE_AI_FEATURES: {
    description: "Enable AI features",
    defaultValue: false,
    clientSafe: true,
  },
  FEATURE_ENABLE_DEV_TOOLS: {
    description: "Enable developer tools",
    defaultValue: false,
    clientSafe: false,
  },
  FEATURE_VERBOSE_LOGGING: {
    description: "Enable verbose logging",
    defaultValue: false,
    clientSafe: false,
  },
  FEATURE_WAITLIST_MODE: {
    description: "Enable waitlist mode (disable signups)",
    defaultValue: false,
    clientSafe: true,
  },
} as const;

export type FeatureFlagKey = keyof typeof featureFlagDefinitions;
export type FeatureFlagValues = Record<FeatureFlagKey, boolean>;

export interface FeatureFlagProvider {
  get(key: FeatureFlagKey): Promise<boolean | null>;
  getAll(): Promise<Partial<FeatureFlagValues>>;
}

/**
 * Feature flags schema for validation
 */
export const featureFlagsSchema = z.object({
  FEATURE_MAINTENANCE_MODE: z.boolean().default(false),
  FEATURE_ENABLE_SIGNUP: z.boolean().default(true),
  FEATURE_ENABLE_OAUTH_GOOGLE: z.boolean().default(true),
  FEATURE_ENABLE_OAUTH_GITHUB: z.boolean().default(true),
  FEATURE_ENABLE_MAGIC_LINK: z.boolean().default(true),
  FEATURE_ENABLE_SUBSCRIPTIONS: z.boolean().default(true),
  FEATURE_ENABLE_USAGE_BASED_BILLING: z.boolean().default(false),
  FEATURE_ENABLE_NEW_DASHBOARD: z.boolean().default(false),
  FEATURE_ENABLE_AI_FEATURES: z.boolean().default(false),
  FEATURE_ENABLE_DEV_TOOLS: z.boolean().default(false),
  FEATURE_VERBOSE_LOGGING: z.boolean().default(false),
  FEATURE_WAITLIST_MODE: z.boolean().default(false),
});

/**
 * Create feature flags from partial input
 */
export function createFeatureFlags(
  input: Partial<Record<FeatureFlagKey, boolean>>
): FeatureFlagValues {
  const defaults: FeatureFlagValues = {
    FEATURE_MAINTENANCE_MODE: false,
    FEATURE_ENABLE_SIGNUP: true,
    FEATURE_ENABLE_OAUTH_GOOGLE: true,
    FEATURE_ENABLE_OAUTH_GITHUB: true,
    FEATURE_ENABLE_MAGIC_LINK: true,
    FEATURE_ENABLE_SUBSCRIPTIONS: true,
    FEATURE_ENABLE_USAGE_BASED_BILLING: false,
    FEATURE_ENABLE_NEW_DASHBOARD: false,
    FEATURE_ENABLE_AI_FEATURES: false,
    FEATURE_ENABLE_DEV_TOOLS: false,
    FEATURE_VERBOSE_LOGGING: false,
    FEATURE_WAITLIST_MODE: false,
  };

  return { ...defaults, ...input };
}

/**
 * Validate feature flags
 */
export function validateFeatureFlags(input: Record<string, unknown>): FeatureFlagValues {
  return featureFlagsSchema.parse(input);
}

/**
 * Resolve feature flags from environment variables
 */
export function resolveEnvFlags(
  env: Record<string, string | undefined>
): Partial<Record<FeatureFlagKey, boolean>> {
  const flags: Partial<Record<FeatureFlagKey, boolean>> = {};

  for (const key of Object.keys(featureFlagDefinitions) as FeatureFlagKey[]) {
    const value = env[key];
    if (value !== undefined) {
      flags[key] = value === "true" || value === "1";
    }
  }

  return flags;
}

/**
 * Get client-safe flags (only those marked as clientSafe)
 */
export function getClientSafeFlags(flags: FeatureFlagValues): Partial<FeatureFlagValues> {
  const safeFlags: Partial<FeatureFlagValues> = {};

  for (const [key, def] of Object.entries(featureFlagDefinitions)) {
    if (def.clientSafe) {
      safeFlags[key as FeatureFlagKey] = flags[key as FeatureFlagKey];
    }
  }

  return safeFlags;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flags: FeatureFlagValues, key: FeatureFlagKey): boolean {
  return flags[key] ?? featureFlagDefinitions[key].defaultValue;
}

/**
 * Get all enabled flags
 */
export function getEnabledFlags(flags: FeatureFlagValues): FeatureFlagKey[] {
  return (Object.keys(flags) as FeatureFlagKey[]).filter((key) => flags[key]);
}

/**
 * Get metadata for a flag
 */
export function getFlagMetadata(key: FeatureFlagKey) {
  return featureFlagDefinitions[key];
}

/**
 * Merge feature flags with priority
 */
export function mergeFeatureFlags(
  ...sources: Partial<Record<FeatureFlagKey, boolean>>[]
): Partial<Record<FeatureFlagKey, boolean>> {
  return Object.assign({}, ...sources);
}

// Re-export product features
export {
  featuresConfig,
  features,
  featureCategories,
  getFeaturesByCategory,
} from "./product-features.js";
export type { Feature } from "./product-features.js";

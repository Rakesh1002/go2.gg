/**
 * @repo/config - Centralized Configuration Package
 *
 * This package provides:
 * - Type-safe environment variable validation
 * - Adapter configuration (auth, db, payments, analytics)
 * - Feature flag system with multiple sources
 *
 * Usage:
 * ```typescript
 * import { getEnv, createAdapterConfig, createFeatureFlags } from "@repo/config";
 *
 * const env = getEnv();
 * const adapters = createAdapterConfig(env);
 * const flags = createFeatureFlags(resolveEnvFlags(env));
 * ```
 */

// Environment configuration
export {
  getEnv,
  getClientEnv,
  validateEnv,
  validateClientEnv,
  validateServerEnv,
  envSchema,
  serverEnvSchema,
  clientEnvSchema,
  featureFlagsSchema,
} from "./env.js";

export type { Env, ServerEnv, ClientEnv, FeatureFlags } from "./env.js";

// Adapter configuration
export {
  createAdapterConfig,
  isAdapterEnabled,
  isPaymentsEnabled,
  isAnalyticsEnabled,
  isRateLimitEnabled,
  registerAdapter,
  getAdapter,
  destroyAllAdapters,
  adapterConfigSchema,
  AuthProviders,
  DbProviders,
  PaymentProviders,
  AnalyticsProviders,
  RateLimitProviders,
  StorageProviders,
} from "./adapters.js";

export type {
  AdapterConfig,
  AuthProvider,
  DbProvider,
  PaymentProvider,
  AnalyticsProvider,
  RateLimitProvider,
  StorageProvider,
  BaseAdapter,
  AdapterFactory,
} from "./adapters.js";

// Feature flags
export {
  featureFlagDefinitions,
  createFeatureFlags,
  validateFeatureFlags,
  resolveEnvFlags,
  getClientSafeFlags,
  isFeatureEnabled,
  getEnabledFlags,
  getFlagMetadata,
  mergeFeatureFlags,
} from "./features.js";

export type {
  FeatureFlagKey,
  FeatureFlagValues,
  FeatureFlagProvider,
} from "./features.js";

// i18n configuration
export {
  locales,
  defaultLocale,
  localeNames,
  isValidLocale,
  getLocaleFromHeader,
  localeCurrencies,
  localeDateFormats,
  formatDate,
  formatCurrency,
  getTranslations,
} from "./i18n.js";

export type { Locale, TranslationKeys } from "./i18n.js";

// Site configuration
export { siteConfig, getUrl, getMetadata } from "./site.js";
export type { SiteConfig } from "./site.js";

// Brand configuration (centralized marketing copy)
export {
  brandPositioning,
  brandStats,
  trialConfig,
  brandCTAs,
  valueProps,
  brandVoice,
  sectionHeadlines,
} from "./brand.js";
export type { BrandCTA, BrandStat } from "./brand.js";

// Pricing configuration
export {
  pricingConfig,
  pricingPlans,
  comparisonTable,
  getPlan,
  getStripePriceId,
  planLimits,
} from "./pricing.js";
export type { PricingPlan, PricingFeature, PlanId, ComparisonCategory } from "./pricing.js";

// Product features configuration
export {
  featuresConfig,
  features,
  featureCategories,
  getFeaturesByCategory,
} from "./product-features.js";
export type { Feature } from "./product-features.js";

// Testimonials configuration
export {
  testimonialsConfig,
  testimonials,
  getFeaturedTestimonials,
  logoCloudCompanies,
} from "./testimonials.js";
export type { Testimonial } from "./testimonials.js";

// FAQ configuration
export {
  faqConfig,
  faqItems,
  faqCategories,
  getFAQByCategory,
  boilerplateFAQItems,
  boilerplateFAQCategories,
  getBoilerplateFAQByCategory,
} from "./faq.js";
export type { FAQItem } from "./faq.js";

// Navigation configuration
export {
  headerNav,
  footerNav,
  dashboardNav,
  mobileNav,
  headerCTA,
} from "./navigation.js";
export type { NavItem, FooterSection } from "./navigation.js";

// Boilerplate product configuration (for selling ShipQuest itself)
export {
  boilerplateConfig,
  boilerplateLicenses,
  boilerplateFeatures,
  boilerplateFAQ,
  boilerplateIncludes,
  getLicense,
  socialProof,
  valuePropositions,
} from "./boilerplate.js";
export type { BoilerplateConfig, BoilerplateLicense } from "./boilerplate.js";

// License utilities
export {
  licenseTiers,
  getLicenseInfo,
  hasLicense,
  generateLicenseKey,
  validateLicenseKey,
  // Backward compatibility exports
  isPremiumEnabled,
  hasFeature,
  requirePremium,
  gatePremiumFeature,
  PremiumFeatureError,
} from "./license.js";
export type { LicenseType, LicenseInfo, PremiumFeature } from "./license.js";

// -----------------------------------------------------------------------------
// Convenience: App Configuration Factory
// -----------------------------------------------------------------------------

import { getEnv, type Env } from "./env.js";
import { createAdapterConfig, type AdapterConfig } from "./adapters.js";
import { createFeatureFlags, resolveEnvFlags, type FeatureFlagValues } from "./features.js";

/**
 * Complete application configuration.
 * This is the unified config object used throughout the app.
 */
export interface AppConfig {
  env: Env;
  adapters: AdapterConfig;
  features: FeatureFlagValues;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Creates the complete application configuration.
 * Call this once at app startup.
 *
 * @param envOverrides - Optional overrides for testing
 */
export function createAppConfig(envOverrides?: Partial<Env>): AppConfig {
  const env = { ...getEnv(), ...envOverrides };
  const adapters = createAdapterConfig(env);
  const features = createFeatureFlags(
    resolveEnvFlags(env as unknown as Record<string, string | undefined>)
  );

  return {
    env,
    adapters,
    features,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
  };
}

/**
 * Creates app config from raw environment (for Cloudflare Workers).
 */
export function createAppConfigFromBindings(
  bindings: Record<string, string | undefined>
): AppConfig {
  const env = validateEnv(bindings);
  const adapters = createAdapterConfig(env);
  const features = createFeatureFlags(resolveEnvFlags(bindings));

  return {
    env,
    adapters,
    features,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
  };
}

// Re-export validateEnv for Workers usage
import { validateEnv } from "./env.js";

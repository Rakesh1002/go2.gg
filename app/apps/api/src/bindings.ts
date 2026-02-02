/**
 * Cloudflare Workers Bindings
 *
 * Type definitions for all Cloudflare bindings available in the Go2 API worker.
 */

export interface Env {
  // -------------------------------------------------------------------------
  // Cloudflare Bindings
  // -------------------------------------------------------------------------

  /** D1 SQLite database */
  DB: D1Database;

  /** KV namespace for config/cache */
  KV_CONFIG: KVNamespace;

  /** KV namespace for link cache (fast edge lookups) */
  LINKS_KV: KVNamespace;

  /** R2 bucket for file storage (QR codes, OG images) */
  R2_BUCKET: R2Bucket;

  /** Durable Object for rate limiting */
  RATE_LIMITER: DurableObjectNamespace;

  /** Queue for background jobs */
  BACKGROUND_QUEUE: Queue;

  /** Analytics Engine for click tracking */
  TRACKER: AnalyticsEngineDataset;

  /** Workers AI for slug suggestions */
  AI: Ai;

  // -------------------------------------------------------------------------
  // OAuth Provider Configuration (Optional)
  // -------------------------------------------------------------------------

  /** Google OAuth */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  /** GitHub OAuth */
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  /** Discord OAuth */
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;

  /** Twitter/X OAuth */
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;

  // -------------------------------------------------------------------------
  // Environment Variables
  // -------------------------------------------------------------------------

  /** Application environment */
  APP_ENV: "development" | "staging" | "production";

  /** Frontend URL for redirects */
  APP_URL: string;

  /** API URL (where this worker is hosted) */
  API_URL?: string;

  /** Default domain for short links */
  DEFAULT_DOMAIN: string;

  /** Stripe secret key */
  STRIPE_SECRET_KEY: string;

  /** Stripe webhook signing secret */
  STRIPE_WEBHOOK_SECRET: string;

  /** Sentry DSN for error tracking */
  SENTRY_DSN?: string;

  /** PostHog API key for server-side analytics */
  POSTHOG_API_KEY?: string;

  /** Turnstile secret key for bot protection */
  TURNSTILE_SECRET_KEY?: string;

  /** Turnstile fail-open mode (allow requests if Turnstile API is down) */
  TURNSTILE_FAIL_OPEN?: string;

  /** CSRF secret for token generation */
  CSRF_SECRET?: string;

  /** Internal API key for service-to-service calls */
  INTERNAL_API_KEY?: string;

  /** Environment mode */
  ENVIRONMENT?: "development" | "staging" | "production";

  // -------------------------------------------------------------------------
  // GitHub App Configuration (for repository access)
  // -------------------------------------------------------------------------

  /** GitHub App ID */
  GITHUB_APP_ID?: string;

  /** GitHub App private key (PEM format) */
  GITHUB_APP_PRIVATE_KEY?: string;

  /** GitHub App installation ID */
  GITHUB_INSTALLATION_ID?: string;

  /** GitHub organization name */
  GITHUB_ORG?: string;

  /** GitHub repository name */
  GITHUB_REPO?: string;

  // -------------------------------------------------------------------------
  // Discord Configuration
  // -------------------------------------------------------------------------

  /** Discord webhook URL for notifications */
  DISCORD_URL?: string;

  // -------------------------------------------------------------------------
  // Email Configuration (Resend)
  // -------------------------------------------------------------------------

  /** Resend API key for sending emails */
  RESEND_API_KEY?: string;

  /** Transactional email sender (auth, billing, alerts) */
  EMAIL_FROM_TRANSACTIONAL?: string;

  /** Marketing email sender (contact form, waitlist) */
  EMAIL_FROM_MARKETING?: string;

  // -------------------------------------------------------------------------
  // Adapter Configuration
  // -------------------------------------------------------------------------

  /** Auth adapter selection */
  AUTH_ADAPTER?: "better-auth";

  /** Database adapter selection */
  DB_ADAPTER?: "d1";

  /** Payments adapter selection */
  PAYMENTS_ADAPTER?: "stripe";

  /** Analytics adapter selection */
  ANALYTICS_ADAPTER?: "posthog" | "none";

  /** Rate limiting adapter selection */
  RATE_LIMIT_ADAPTER?: "durable-object" | "none";
}

/**
 * Link data stored in KV for fast edge lookups
 */
/**
 * Tracking pixel configuration
 */
export interface TrackingPixel {
  type: "facebook" | "google" | "linkedin" | "tiktok" | "twitter" | "pinterest" | "ga4" | "custom";
  pixelId: string;
  enabled: boolean;
  events?: string[]; // e.g., ['PageView', 'Lead'] for Facebook
  customScript?: string; // For custom pixel type
}

/**
 * Link data stored in KV for fast edge lookups
 */
export interface CachedLink {
  id: string;
  destinationUrl: string;
  domain: string;
  slug: string;
  userId?: string;
  organizationId?: string;
  geoTargets?: Record<string, string>; // { country: url }
  deviceTargets?: Record<string, string>; // { mobile: url, desktop: url }
  passwordHash?: string;
  expiresAt?: string;
  clickLimit?: number;
  clickCount?: number;
  iosUrl?: string;
  androidUrl?: string;
  abTestId?: string;
  abVariant?: string;
  // Link cloaking (URL masking)
  rewrite?: boolean;
  // OG metadata for cloaked links
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  // Retargeting pixels
  trackingPixels?: TrackingPixel[];
  enablePixelTracking?: boolean;
  requirePixelConsent?: boolean;
  // Analytics configuration
  trackAnalytics?: boolean; // Enable/disable click tracking (default: true)
  publicStats?: boolean; // Make analytics publicly accessible
  trackConversion?: boolean; // Enable conversion tracking
  skipDeduplication?: boolean; // Skip click deduplication
}

/**
 * Click event for Analytics Engine
 */
export interface ClickEvent {
  linkId: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  timestamp: number;
}

// Type augmentation for Hono context
// Note: The `user` and `session` types are declared in middleware/auth.ts
declare module "hono" {
  interface ContextVariableMap {
    /** Request ID for tracing */
    requestId: string;
    /** Resolved link from redirect handler */
    link?: CachedLink;
  }
}

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

  /** Dunning Workflow — durable per-step state for failed-payment reminders */
  DUNNING_WORKFLOW: Workflow<{ triggeredAt: string }>;

  /**
   * Link Expiry Workflow — sleeps until a link's `expiresAt` then evicts
   * the KV cache entry. One instance per (linkId, expiresAt) pair.
   */
  LINK_EXPIRY_WORKFLOW?: Workflow<{
    linkId: string;
    expiresAt: string;
    scheduledAt: string;
  }>;

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

  /**
   * Stripe metered Price ID for the Scale tier. When unset the daily
   * usage-report cron is a no-op — gate-on-first-inbound, see
   * lib/metered-billing.ts.
   */
  STRIPE_METERED_PRICE_ID_SCALE?: string;

  /** PostHog project token for server-side analytics (phc_…) */
  POSTHOG_API_KEY?: string;
  /** PostHog host (default https://us.i.posthog.com) */
  POSTHOG_HOST?: string;

  /** GA4 measurement ID (G-XXXXXXXXXX) for Measurement Protocol */
  GA4_MEASUREMENT_ID?: string;
  /** GA4 API secret for Measurement Protocol */
  GA4_API_SECRET?: string;

  /**
   * When set to "false", new affiliate applications land in `pending` and
   * require manual admin approval. Default is auto-approve — friction at
   * apply-time kills affiliate funnels; review at payout-time instead.
   */
  AFFILIATE_AUTO_APPROVE?: string;

  /** Comma-separated admin email allowlist. Used to gate admin endpoints. */
  ADMIN_EMAILS?: string;

  /** aigateway.sh API key — routes shortener AI calls (Kimi K2.6 by default) */
  AI_GATEWAY_API_KEY?: string;
  /** Override the gateway base URL (default: https://api.aigateway.sh) */
  AI_GATEWAY_BASE_URL?: string;
  /** Override the gateway model id (default: moonshot/kimi-k2.6) */
  AI_GATEWAY_MODEL?: string;

  /** Axiom ingest token (xaat-…) — used by lib/axiom.ts to publish logs */
  AXIOM_API_KEY?: string;
  /** Axiom dataset name to publish into (default: go2) */
  AXIOM_DATASET?: string;

  /**
   * Google Safe Browsing v4 Lookup API key. When unset, the destination
   * threat check is a no-op and lib/safe-browsing.ts returns "unknown" —
   * link creation is not blocked.
   */
  GOOGLE_SAFE_BROWSING_API_KEY?: string;

  /** Cloudflare account id for the URL Scanner v2 API (second-layer phishing check). */
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** Cloudflare API token with `URL Scanner:Read` scope. */
  CLOUDFLARE_URLSCANNER_TOKEN?: string;

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

  /** Demo/preview mode — disables write operations for non-admin users when set to "true" */
  DEMO_MODE?: string;

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

  /** Bearer token used by /admin/* routes for internal operations */
  ADMIN_TOKEN?: string;

  // -------------------------------------------------------------------------
  // Email Configuration (Cloudflare Email Sending Service)
  // -------------------------------------------------------------------------

  /**
   * Cloudflare Email Sending binding.
   * Wired via [[send_email]] in wrangler.toml. go2.gg is verified for sending
   * in the Cloudflare dashboard, which lets us deliver to any recipient.
   */
  EMAIL?: SendEmailBinding;

  /** Transactional email sender (auth, billing, alerts) */
  EMAIL_FROM_TRANSACTIONAL?: string;

  /** Marketing email sender (contact form, waitlist) */
  EMAIL_FROM_MARKETING?: string;

  /**
   * Destination address for inbound mail forwarded by the email() Worker
   * handler. Set per-deploy via `wrangler secret put MAIL_FORWARD_TO`. Falls
   * back to support@go2.gg in source so the public repo carries no operator
   * personal address.
   */
  MAIL_FORWARD_TO?: string;

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
  /** Plan-tier retention expiry — separate from user-set expiresAt. */
  policyExpiresAt?: string;
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
  // Agent attribution — set when an AI agent created this link.
  // Carried through to every click as the default agent context, unless
  // overridden at click time via query params or x-agent-* headers.
  agentId?: string;
  agentRunId?: string;
  agentActorId?: string;
  agentMetadata?: Record<string, unknown>;
  // Defense-in-depth: archived links are normally deleted from KV at archive
  // time, but a stale entry can race with a click. The redirect handler treats
  // a truthy isArchived as 410 Gone.
  isArchived?: boolean;
  // Safety state — populated when the link is disabled by Safe Browsing,
  // URL Scanner, an abuse report, or an admin. The redirect handler returns
  // 410 Gone when isDisabled is true. disabledReason is shown on the
  // interstitial / report-abuse page; never expose it raw to crawlers.
  isDisabled?: boolean;
  disabledReason?: string;
  // Per-destination safety verdict (mirrors links.threat_status). The
  // resolver gates the interstitial on this: "clean" → straight redirect,
  // "flagged" → already disabled (won't reach here), "unknown" → interstitial.
  threatStatus?: "clean" | "flagged" | "unknown";
  // ISO timestamp — used by the redirect handler to gate the interstitial
  // ("show a warning for links created < 24h ago").
  createdAt?: string;
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

// -----------------------------------------------------------------------------
// Cloudflare Email Sending types
// https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
// -----------------------------------------------------------------------------

export interface CFEmailAttachment {
  /** Base64-encoded content or raw ArrayBuffer */
  content: string | ArrayBuffer;
  filename: string;
  /** MIME type, e.g. "application/pdf" */
  type: string;
  disposition: "attachment" | "inline";
  contentId?: string;
}

export interface CFEmailMessage {
  to: string | string[];
  from: string | { email: string; name: string };
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | { email: string; name: string };
  attachments?: CFEmailAttachment[];
  headers?: Record<string, string>;
}

export interface CFEmailSendResult {
  messageId?: string;
}

export interface SendEmailBinding {
  send(message: CFEmailMessage): Promise<CFEmailSendResult>;
}

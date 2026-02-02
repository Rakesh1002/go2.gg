/**
 * Database Schema Definitions
 *
 * This file defines the database schema using Drizzle ORM.
 * The schema is designed to be portable between SQLite (D1) and PostgreSQL (Supabase).
 *
 * Key entities:
 * - Users: Individual user accounts
 * - Organizations: Multi-tenant organization support
 * - OrganizationMembers: User membership in organizations
 * - Subscriptions: Stripe subscription tracking
 * - Sessions: Auth session management
 */

import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export const users = sqliteTable(
  "user", // Better Auth expects singular table name
  {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull().unique(),
    name: text("name"),
    image: text("image"), // Better Auth convention
    emailVerified: integer("emailVerified", { mode: "boolean" }).default(false),
    // Timestamps - Better Auth expects camelCase column names
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// -----------------------------------------------------------------------------
// Accounts (OAuth Provider Links - Better Auth)
// -----------------------------------------------------------------------------

export const accounts = sqliteTable(
  "account", // Better Auth expects table name "account" (singular)
  {
    id: text("id").primaryKey(), // UUID
    userId: text("userId") // Better Auth expects "userId" column
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // OAuth provider info - Better Auth expects these exact column names
    providerId: text("providerId").notNull(), // google, github, discord, twitter, "credential" for email/password
    accountId: text("accountId").notNull(), // The provider's account ID
    // Password hash - for email/password auth (providerId: "credential")
    password: text("password"), // Hashed password using scrypt
    // Tokens
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    accessTokenExpiresAt: text("accessTokenExpiresAt"),
    refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
    // OAuth scopes
    scope: text("scope"),
    // ID token for OIDC providers
    idToken: text("idToken"),
    // Timestamps
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_idx").on(table.userId),
  ],
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

// -----------------------------------------------------------------------------
// Verification Tokens (Email verification, password reset - Better Auth)
// -----------------------------------------------------------------------------

export const verificationTokens = sqliteTable(
  "verification", // Better Auth expects singular table name
  {
    id: text("id").primaryKey(), // UUID
    identifier: text("identifier").notNull(), // Usually email
    value: text("value").notNull().unique(), // Better Auth expects 'value' column
    // Timestamps - Better Auth expects camelCase column names
    expiresAt: text("expiresAt").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt").default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("verification_tokens_token_idx").on(table.value),
    index("verification_tokens_identifier_idx").on(table.identifier),
  ],
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("organizations_slug_idx").on(table.slug),
    index("organizations_stripe_customer_idx").on(table.stripeCustomerId),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// -----------------------------------------------------------------------------
// Organization Members
// -----------------------------------------------------------------------------

export const organizationRoles = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];

export const organizationMembers = sqliteTable(
  "organization_members",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: organizationRoles }).notNull().default("member"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("org_members_unique_idx").on(
      table.organizationId,
      table.userId,
    ),
    index("org_members_user_idx").on(table.userId),
    index("org_members_org_idx").on(table.organizationId),
  ],
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

// -----------------------------------------------------------------------------
// Subscriptions
// -----------------------------------------------------------------------------

export const subscriptionStatuses = [
  "trialing",
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const subscriptionPlans = [
  "free",
  "pro",
  "business",
  "enterprise",
] as const;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(), // Stripe subscription ID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripePriceId: text("stripe_price_id").notNull(),
    plan: text("plan", { enum: subscriptionPlans }).notNull().default("free"),
    status: text("status", { enum: subscriptionStatuses }).notNull(),
    currentPeriodStart: text("current_period_start"),
    currentPeriodEnd: text("current_period_end"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", {
      mode: "boolean",
    }).default(false),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("subscriptions_stripe_idx").on(table.stripeSubscriptionId),
    index("subscriptions_org_idx").on(table.organizationId),
    index("subscriptions_status_idx").on(table.status),
  ],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// -----------------------------------------------------------------------------
// Sessions (for custom auth or session tracking)
// -----------------------------------------------------------------------------

export const sessions = sqliteTable(
  "session", // Better Auth expects singular table name
  {
    id: text("id").primaryKey(), // Session ID (UUID)
    userId: text("userId") // Better Auth expects camelCase
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Better Auth session fields
    token: text("token").notNull().unique(), // Session token (sent in cookie)
    expiresAt: text("expiresAt").notNull(), // Better Auth expects camelCase
    // Device/client info
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    // Timestamps - Better Auth expects camelCase
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("session_token_idx").on(table.token),
    index("session_user_idx").on(table.userId),
    index("session_expires_idx").on(table.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// -----------------------------------------------------------------------------
// API Keys
// -----------------------------------------------------------------------------

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(), // SHA-256 hash of the key
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
    lastUsedAt: text("last_used_at"),
    expiresAt: text("expires_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("api_keys_org_idx").on(table.organizationId),
    uniqueIndex("api_keys_hash_idx").on(table.keyHash),
  ],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

// -----------------------------------------------------------------------------
// Organization Invitations
// -----------------------------------------------------------------------------

export const invitationStatuses = [
  "pending",
  "accepted",
  "expired",
  "revoked",
] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: organizationRoles }).notNull().default("member"),
    token: text("token").notNull().unique(),
    status: text("status", { enum: invitationStatuses })
      .notNull()
      .default("pending"),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    acceptedAt: text("accepted_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("invitations_token_idx").on(table.token),
    index("invitations_org_idx").on(table.organizationId),
    index("invitations_email_idx").on(table.email),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

// -----------------------------------------------------------------------------
// Referrals
// -----------------------------------------------------------------------------

export const referralStatuses = [
  "pending",
  "converted",
  "paid",
  "refunded",
] as const;
export type ReferralStatus = (typeof referralStatuses)[number];

export const referrals = sqliteTable(
  "referrals",
  {
    id: text("id").primaryKey(), // UUID
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    referredEmail: text("referred_email").notNull(),
    purchaseId: text("purchase_id"), // Stripe payment/subscription ID
    purchaseAmount: integer("purchase_amount"), // In cents
    commission: integer("commission"), // In cents
    status: text("status", { enum: referralStatuses })
      .notNull()
      .default("pending"),
    convertedAt: text("converted_at"),
    paidAt: text("paid_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("referrals_affiliate_idx").on(table.affiliateId),
    index("referrals_referred_user_idx").on(table.referredUserId),
    index("referrals_status_idx").on(table.status),
  ],
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

// -----------------------------------------------------------------------------
// User Metadata (for admin features)
// -----------------------------------------------------------------------------

export const userMetadata = sqliteTable("user_metadata", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  isBanned: integer("is_banned", { mode: "boolean" }).default(false),
  bannedAt: text("banned_at"),
  bannedReason: text("banned_reason"),
  referralCode: text("referral_code"), // Code used when signing up
  lastLoginAt: text("last_login_at"),
  loginCount: integer("login_count").default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type UserMetadata = typeof userMetadata.$inferSelect;
export type NewUserMetadata = typeof userMetadata.$inferInsert;

// -----------------------------------------------------------------------------
// Boilerplate Purchases (for ShipQuest license sales)
// -----------------------------------------------------------------------------

export const purchaseStatuses = ["pending", "completed", "refunded"] as const;
export type PurchaseStatus = (typeof purchaseStatuses)[number];

export const licenseTypes = ["personal", "team", "enterprise"] as const;
export type LicenseType = (typeof licenseTypes)[number];

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull(),
    githubUsername: text("github_username"),
    licenseId: text("license_id", { enum: licenseTypes }).notNull(),
    licenseName: text("license_name").notNull(),
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id"),
    amount: integer("amount").notNull(), // In cents
    currency: text("currency").notNull().default("usd"),
    status: text("status", { enum: purchaseStatuses })
      .notNull()
      .default("completed"),
    githubAccessGranted: integer("github_access_granted", {
      mode: "boolean",
    }).default(false),
    githubAccessGrantedAt: text("github_access_granted_at"),
    refundedAt: text("refunded_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("purchases_stripe_session_idx").on(table.stripeSessionId),
    index("purchases_email_idx").on(table.email),
    index("purchases_github_idx").on(table.githubUsername),
    index("purchases_status_idx").on(table.status),
  ],
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

// -----------------------------------------------------------------------------
// Waitlist Entries
// -----------------------------------------------------------------------------

export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull().unique(),
    name: text("name"),
    source: text("source"), // Where they signed up from (landing, blog, etc.)
    referralCode: text("referral_code"),
    notified: integer("notified", { mode: "boolean" }).default(false),
    notifiedAt: text("notified_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("waitlist_email_idx").on(table.email),
    index("waitlist_notified_idx").on(table.notified),
  ],
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;

// -----------------------------------------------------------------------------
// Links (Go2 URL Shortener)
// -----------------------------------------------------------------------------

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for guest links
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    folderId: text("folder_id"), // Link folder for organization
    slug: text("slug").notNull(),
    destinationUrl: text("destination_url").notNull(),
    domain: text("domain").notNull().default("go2.gg"),
    title: text("title"),
    description: text("description"),
    tags: text("tags"), // JSON array
    passwordHash: text("password_hash"),
    expiresAt: text("expires_at"),
    clickLimit: integer("click_limit"),
    clickCount: integer("click_count").notNull().default(0),
    // Targeting
    geoTargets: text("geo_targets"), // JSON: { country: url }
    deviceTargets: text("device_targets"), // JSON: { mobile: url, desktop: url }
    // UTM parameters
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    // A/B testing
    abTestId: text("ab_test_id"),
    abVariant: text("ab_variant"),
    // Status
    isArchived: integer("is_archived", { mode: "boolean" }).default(false),
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
    // iOS/Android deep links
    iosUrl: text("ios_url"),
    androidUrl: text("android_url"),
    // Link cloaking (URL masking)
    rewrite: integer("rewrite", { mode: "boolean" }).default(false),
    // OG metadata override
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    // Retargeting Pixels (JSON array of pixel configurations)
    // Format: [{ type: 'facebook' | 'google' | 'linkedin' | 'tiktok' | 'twitter' | 'pinterest' | 'ga4' | 'custom',
    //            pixelId: string, enabled: boolean, events?: string[] }]
    trackingPixels: text("tracking_pixels"),
    // Enable pixel tracking page (shows brief interstitial to fire pixels)
    enablePixelTracking: integer("enable_pixel_tracking", {
      mode: "boolean",
    }).default(false),
    // GDPR consent mode - require consent before firing pixels
    requirePixelConsent: integer("require_pixel_consent", {
      mode: "boolean",
    }).default(false),
    // Analytics Configuration (per-link settings)
    // Enable/disable click analytics tracking for this link
    trackAnalytics: integer("track_analytics", { mode: "boolean" }).default(
      true,
    ),
    // Make analytics publicly accessible (shareable stats page)
    publicStats: integer("public_stats", { mode: "boolean" }).default(false),
    // Enable conversion tracking for this link (leads/sales)
    trackConversion: integer("track_conversion", { mode: "boolean" }).default(
      false,
    ),
    // Conversion goal URL pattern (e.g., /thank-you, /checkout/success)
    conversionUrl: text("conversion_url"),
    // Skip click deduplication (count every click, useful for specific campaigns)
    skipDeduplication: integer("skip_deduplication", {
      mode: "boolean",
    }).default(false),
    // Aggregated conversion counts
    leadCount: integer("lead_count").notNull().default(0),
    saleCount: integer("sale_count").notNull().default(0),
    saleAmount: integer("sale_amount").notNull().default(0), // Total revenue in cents
    // QR code scan tracking
    qrScans: integer("qr_scans").notNull().default(0),
    // Unique visitor count (deduplicated by IP hash)
    uniqueClicks: integer("unique_clicks").notNull().default(0),
    // Migration tracking
    migrationId: text("migration_id"), // ID of the migration that created this link
    migrationSource: text("migration_source"), // Source provider (bitly, rebrandly, etc.)
    migrationOriginalId: text("migration_original_id"), // Original ID from source platform
    // Link Health Monitoring
    healthStatus: text("health_status", {
      enum: ["healthy", "degraded", "broken", "unknown"],
    }).default("unknown"),
    healthStatusCode: integer("health_status_code"), // HTTP status code
    healthResponseTime: integer("health_response_time"), // Response time in ms
    healthErrorMessage: text("health_error_message"),
    lastHealthCheck: text("last_health_check"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastClickedAt: text("last_clicked_at"),
  },
  (table) => [
    uniqueIndex("links_domain_slug_idx").on(table.domain, table.slug),
    index("links_user_idx").on(table.userId),
    index("links_org_idx").on(table.organizationId),
    index("links_created_idx").on(table.createdAt),
    index("links_click_count_idx").on(table.clickCount),
    index("links_health_status_idx").on(table.healthStatus),
  ],
);

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;

// -----------------------------------------------------------------------------
// Custom Domains
// -----------------------------------------------------------------------------

export const domainVerificationStatuses = [
  "pending",
  "verified",
  "failed",
] as const;
export type DomainVerificationStatus =
  (typeof domainVerificationStatuses)[number];

export const domains = sqliteTable(
  "domains",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    domain: text("domain").notNull().unique(),
    verificationStatus: text("verification_status", {
      enum: domainVerificationStatuses,
    })
      .notNull()
      .default("pending"),
    verificationToken: text("verification_token").notNull(),
    verifiedAt: text("verified_at"),
    // SSL/TLS
    sslStatus: text("ssl_status"),
    // Default settings for links on this domain
    defaultRedirectUrl: text("default_redirect_url"),
    notFoundUrl: text("not_found_url"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("domains_domain_idx").on(table.domain),
    index("domains_user_idx").on(table.userId),
    index("domains_org_idx").on(table.organizationId),
    index("domains_verification_idx").on(table.verificationStatus),
  ],
);

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;

// -----------------------------------------------------------------------------
// Clicks (Detailed click events - supplement to Analytics Engine)
// -----------------------------------------------------------------------------

export const clickTriggers = ["link", "qr", "api"] as const;
export type ClickTrigger = (typeof clickTriggers)[number];

export const clicks = sqliteTable(
  "clicks",
  {
    id: text("id").primaryKey(), // 16-char nanoid for efficiency
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    // Workspace context (denormalized for query performance)
    userId: text("user_id"),
    organizationId: text("organization_id"),
    domain: text("domain"), // Short link domain
    slug: text("slug"), // Short link slug (key)
    destinationUrl: text("destination_url"), // Where the click went
    // Geolocation (from Cloudflare cf object)
    continent: text("continent"), // Continent code (NA, EU, AS, etc.)
    country: text("country"), // ISO country code
    region: text("region"), // State/province
    city: text("city"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    timezone: text("timezone"), // IANA timezone
    postalCode: text("postal_code"),
    // Device info (enhanced)
    device: text("device"), // desktop, mobile, tablet
    deviceVendor: text("device_vendor"), // Apple, Samsung, etc.
    deviceModel: text("device_model"), // iPhone 15, Galaxy S24, etc.
    // Browser info
    browser: text("browser"),
    browserVersion: text("browser_version"),
    // Rendering engine
    engine: text("engine"), // Blink, WebKit, Gecko
    engineVersion: text("engine_version"),
    // OS info
    os: text("os"),
    osVersion: text("os_version"),
    // CPU architecture
    cpuArchitecture: text("cpu_architecture"), // amd64, arm64, etc.
    // Request info
    referrer: text("referrer"), // Full referrer URL
    referrerDomain: text("referrer_domain"), // Normalized domain
    ipHash: text("ip_hash"), // SHA-256 hash for privacy
    identityHash: text("identity_hash"), // Hash of IP + UA for deduplication
    userAgent: text("user_agent"),
    // Click trigger
    trigger: text("trigger", { enum: clickTriggers }).default("link"), // link, qr, api
    isQr: integer("is_qr", { mode: "boolean" }).default(false), // Convenience flag
    // Bot detection
    isBot: integer("is_bot", { mode: "boolean" }).default(false),
    // Is this a unique click (first from this identity hash)?
    isUnique: integer("is_unique", { mode: "boolean" }).default(true),
    // UTM parameters captured from destination URL
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    // A/B test tracking
    abTestId: text("ab_test_id"),
    abVariant: text("ab_variant"),
    // Edge/CDN info
    edgeRegion: text("edge_region"), // Cloudflare colo/region
    // Timestamp
    timestamp: text("timestamp")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("clicks_link_idx").on(table.linkId),
    index("clicks_user_idx").on(table.userId),
    index("clicks_org_idx").on(table.organizationId),
    index("clicks_timestamp_idx").on(table.timestamp),
    index("clicks_country_idx").on(table.country),
    index("clicks_device_idx").on(table.device),
    index("clicks_browser_idx").on(table.browser),
    index("clicks_os_idx").on(table.os),
    index("clicks_referrer_idx").on(table.referrerDomain),
    index("clicks_trigger_idx").on(table.trigger),
    index("clicks_identity_idx").on(table.identityHash),
  ],
);

export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;

// -----------------------------------------------------------------------------
// Link Tags
// -----------------------------------------------------------------------------

export const linkTags = sqliteTable(
  "link_tags",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    color: text("color").default("#6366f1"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("link_tags_user_name_idx").on(table.userId, table.name),
    index("link_tags_org_idx").on(table.organizationId),
  ],
);

export type LinkTag = typeof linkTags.$inferSelect;
export type NewLinkTag = typeof linkTags.$inferInsert;

// -----------------------------------------------------------------------------
// Link Tag Assignments (Many-to-many join table)
// -----------------------------------------------------------------------------

export const linkTagAssignments = sqliteTable(
  "link_tag_assignments",
  {
    id: text("id").primaryKey(), // UUID
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => linkTags.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("link_tag_assignments_unique_idx").on(
      table.linkId,
      table.tagId,
    ),
    index("link_tag_assignments_link_idx").on(table.linkId),
    index("link_tag_assignments_tag_idx").on(table.tagId),
  ],
);

export type LinkTagAssignment = typeof linkTagAssignments.$inferSelect;
export type NewLinkTagAssignment = typeof linkTagAssignments.$inferInsert;

// -----------------------------------------------------------------------------
// Link Folders
// -----------------------------------------------------------------------------

export const folderAccessLevels = ["read", "write"] as const;
export type FolderAccessLevel = (typeof folderAccessLevels)[number];

export const folders = sqliteTable(
  "folders",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6366f1"), // Hex color for UI
    icon: text("icon").default("folder"), // Icon name
    // Access control
    accessLevel: text("access_level", { enum: folderAccessLevels })
      .notNull()
      .default("write"),
    // Hierarchy (optional parent folder)
    parentId: text("parent_id"),
    // Stats
    linkCount: integer("link_count").notNull().default(0),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("folders_user_idx").on(table.userId),
    index("folders_org_idx").on(table.organizationId),
    index("folders_parent_idx").on(table.parentId),
  ],
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

// -----------------------------------------------------------------------------
// A/B Tests
// -----------------------------------------------------------------------------

export const abTestStatuses = [
  "draft",
  "running",
  "paused",
  "completed",
] as const;
export type ABTestStatus = (typeof abTestStatuses)[number];

export const abTests = sqliteTable(
  "ab_tests",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: abTestStatuses }).notNull().default("draft"),
    // Variants (JSON array of { id, url, weight })
    variants: text("variants").notNull(), // JSON
    // Winner determination
    winnerVariantId: text("winner_variant_id"),
    // Traffic split
    trafficPercentage: integer("traffic_percentage").notNull().default(100),
    // Timestamps
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("ab_tests_user_idx").on(table.userId),
    index("ab_tests_org_idx").on(table.organizationId),
    index("ab_tests_status_idx").on(table.status),
  ],
);

export type ABTest = typeof abTests.$inferSelect;
export type NewABTest = typeof abTests.$inferInsert;

// -----------------------------------------------------------------------------
// Webhooks (Outgoing event streaming)
// -----------------------------------------------------------------------------

export const webhookEvents = [
  "click",
  "link.created",
  "link.updated",
  "link.deleted",
  "domain.verified",
  "qr.scanned",
] as const;
export type WebhookEvent = (typeof webhookEvents)[number];

export const webhooks = sqliteTable(
  "webhooks",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    events: text("events").notNull(), // JSON array of WebhookEvent
    secret: text("secret").notNull(), // HMAC secret for signature verification
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastTriggeredAt: text("last_triggered_at"),
    lastStatus: integer("last_status"), // HTTP status code of last delivery
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("webhooks_user_idx").on(table.userId),
    index("webhooks_org_idx").on(table.organizationId),
    index("webhooks_active_idx").on(table.isActive),
  ],
);

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

// Webhook delivery log for debugging
export const webhookDeliveries = sqliteTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(), // UUID
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: text("payload").notNull(), // JSON
    statusCode: integer("status_code"),
    response: text("response"),
    duration: integer("duration"), // ms
    success: integer("success", { mode: "boolean" }).default(false),
    attempts: integer("attempts").notNull().default(1),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("webhook_deliveries_webhook_idx").on(table.webhookId),
    index("webhook_deliveries_created_idx").on(table.createdAt),
  ],
);

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// -----------------------------------------------------------------------------
// Link Galleries (Link-in-Bio)
// -----------------------------------------------------------------------------

export const linkGalleries = sqliteTable(
  "link_galleries",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    domain: text("domain").notNull().default("go2.gg"),
    title: text("title"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    theme: text("theme").default("default"), // JSON theme config
    themeConfig: text("theme_config"), // JSON: colors, fonts, etc.
    socialLinks: text("social_links"), // JSON array of social profiles
    customCss: text("custom_css"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isPublished: integer("is_published", { mode: "boolean" }).default(false),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("link_galleries_domain_slug_idx").on(table.domain, table.slug),
    index("link_galleries_user_idx").on(table.userId),
    index("link_galleries_org_idx").on(table.organizationId),
  ],
);

export type LinkGallery = typeof linkGalleries.$inferSelect;
export type NewLinkGallery = typeof linkGalleries.$inferInsert;

// Gallery items (links, headers, embeds)
export const galleryItemTypes = [
  "link",
  "header",
  "divider",
  "embed",
  "image",
] as const;
export type GalleryItemType = (typeof galleryItemTypes)[number];

export const galleryItems = sqliteTable(
  "gallery_items",
  {
    id: text("id").primaryKey(), // UUID
    galleryId: text("gallery_id")
      .notNull()
      .references(() => linkGalleries.id, { onDelete: "cascade" }),
    type: text("type", { enum: galleryItemTypes }).notNull().default("link"),
    title: text("title"),
    url: text("url"),
    thumbnailUrl: text("thumbnail_url"),
    iconName: text("icon_name"), // Lucide icon name
    position: integer("position").notNull(),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true),
    clickCount: integer("click_count").notNull().default(0),
    // For embeds
    embedType: text("embed_type"), // youtube, tiktok, spotify, etc.
    embedData: text("embed_data"), // JSON
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("gallery_items_gallery_idx").on(table.galleryId),
    index("gallery_items_position_idx").on(table.position),
  ],
);

export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;

// -----------------------------------------------------------------------------
// QR Codes (Saved QR configurations)
// -----------------------------------------------------------------------------

export const qrCodes = sqliteTable(
  "qr_codes",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    linkId: text("link_id").references(() => links.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    url: text("url").notNull(), // Target URL
    // Style configuration
    size: integer("size").default(256),
    foregroundColor: text("foreground_color").default("#000000"),
    backgroundColor: text("background_color").default("#FFFFFF"),
    logoUrl: text("logo_url"),
    logoSize: integer("logo_size").default(50), // Percentage of QR size
    cornerRadius: integer("corner_radius").default(0),
    errorCorrection: text("error_correction").default("M"), // L, M, Q, H
    // AI-generated style
    aiStyle: text("ai_style"), // JSON config for AI-generated QR
    aiImageUrl: text("ai_image_url"),
    // Stats
    scanCount: integer("scan_count").notNull().default(0),
    lastScannedAt: text("last_scanned_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("qr_codes_user_idx").on(table.userId),
    index("qr_codes_org_idx").on(table.organizationId),
    index("qr_codes_link_idx").on(table.linkId),
  ],
);

export type QRCode = typeof qrCodes.$inferSelect;
export type NewQRCode = typeof qrCodes.$inferInsert;

// -----------------------------------------------------------------------------
// Conversion Goals
// -----------------------------------------------------------------------------

export const conversionGoalTypes = [
  "page_view",
  "signup",
  "purchase",
  "lead",
  "download",
  "custom",
] as const;
export type ConversionGoalType = (typeof conversionGoalTypes)[number];

export const conversionGoals = sqliteTable(
  "conversion_goals",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    type: text("type", { enum: conversionGoalTypes })
      .notNull()
      .default("custom"),
    // Matching criteria
    urlPattern: text("url_pattern"), // Regex or exact URL to match
    eventName: text("event_name"), // Custom event name
    // Attribution window in days (default 30)
    attributionWindow: integer("attribution_window").default(30),
    // Value tracking
    hasValue: integer("has_value", { mode: "boolean" }).default(false),
    defaultValue: integer("default_value"), // In cents
    currency: text("currency").default("usd"),
    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("conversion_goals_user_idx").on(table.userId),
    index("conversion_goals_org_idx").on(table.organizationId),
  ],
);

export type ConversionGoal = typeof conversionGoals.$inferSelect;
export type NewConversionGoal = typeof conversionGoals.$inferInsert;

// -----------------------------------------------------------------------------
// Conversions (Tracked conversion events)
// -----------------------------------------------------------------------------

export const conversions = sqliteTable(
  "conversions",
  {
    id: text("id").primaryKey(), // UUID
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    clickId: text("click_id").references(() => clicks.id, {
      onDelete: "set null",
    }),
    goalId: text("goal_id").references(() => conversionGoals.id, {
      onDelete: "set null",
    }),
    // Conversion type
    type: text("type", { enum: conversionGoalTypes }).notNull(),
    eventName: text("event_name"),
    // Attribution
    attributedAt: text("attributed_at"), // When the original click happened
    convertedAt: text("converted_at").notNull(), // When conversion happened
    // Value tracking (for purchases)
    value: integer("value"), // In cents
    currency: text("currency").default("usd"),
    // External references
    externalId: text("external_id"), // e.g., Stripe payment ID, order ID
    customerId: text("customer_id"), // e.g., Stripe customer ID
    // Metadata
    metadata: text("metadata"), // JSON for additional data
    // Device/session info (from click)
    country: text("country"),
    device: text("device"),
    browser: text("browser"),
    referrer: text("referrer"),
    // A/B test tracking
    abTestId: text("ab_test_id"),
    abVariant: text("ab_variant"),
    // Unique constraint to prevent duplicate conversions
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("conversions_link_idx").on(table.linkId),
    index("conversions_click_idx").on(table.clickId),
    index("conversions_goal_idx").on(table.goalId),
    index("conversions_type_idx").on(table.type),
    index("conversions_converted_idx").on(table.convertedAt),
    index("conversions_external_idx").on(table.externalId),
  ],
);

export type Conversion = typeof conversions.$inferSelect;
export type NewConversion = typeof conversions.$inferInsert;

// -----------------------------------------------------------------------------
// Link Conversion Goals (Many-to-many)
// -----------------------------------------------------------------------------

export const linkConversionGoals = sqliteTable(
  "link_conversion_goals",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    goalId: text("goal_id")
      .notNull()
      .references(() => conversionGoals.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("link_conversion_goals_unique_idx").on(
      table.linkId,
      table.goalId,
    ),
    index("link_conversion_goals_link_idx").on(table.linkId),
    index("link_conversion_goals_goal_idx").on(table.goalId),
  ],
);

export type LinkConversionGoal = typeof linkConversionGoals.$inferSelect;
export type NewLinkConversionGoal = typeof linkConversionGoals.$inferInsert;

// -----------------------------------------------------------------------------
// Migrations (From competitor platforms)
// -----------------------------------------------------------------------------

export const migrationStatuses = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;
export type MigrationStatus = (typeof migrationStatuses)[number];

export const migrationProviders = [
  "bitly",
  "rebrandly",
  "shortio",
  "tinyurl",
  "dub",
] as const;
export type MigrationProvider = (typeof migrationProviders)[number];

export const migrations = sqliteTable(
  "migrations",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    provider: text("provider", { enum: migrationProviders }).notNull(),
    status: text("status", { enum: migrationStatuses })
      .notNull()
      .default("pending"),
    totalLinks: integer("total_links").notNull().default(0),
    importedLinks: integer("imported_links").notNull().default(0),
    skippedLinks: integer("skipped_links").notNull().default(0),
    failedLinks: integer("failed_links").notNull().default(0),
    errors: text("errors"), // JSON array of errors
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("migrations_user_idx").on(table.userId),
    index("migrations_org_idx").on(table.organizationId),
    index("migrations_status_idx").on(table.status),
  ],
);

export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;

// -----------------------------------------------------------------------------
// Dunning Records (Failed Payment Tracking)
// -----------------------------------------------------------------------------

export const dunningRecords = sqliteTable(
  "dunning_records",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeInvoiceId: text("stripe_invoice_id").notNull(),
    email: text("email").notNull(),
    amount: integer("amount").notNull(), // In cents
    currency: text("currency").notNull().default("usd"),
    failedAt: text("failed_at").notNull(),
    lastReminderSent: integer("last_reminder_sent").notNull().default(0), // 0, 3, 7, or 10
    lastReminderSentAt: text("last_reminder_sent_at"),
    resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
    resolvedAt: text("resolved_at"),
    canceledAt: text("canceled_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("dunning_org_idx").on(table.organizationId),
    index("dunning_customer_idx").on(table.stripeCustomerId),
    index("dunning_invoice_idx").on(table.stripeInvoiceId),
    index("dunning_resolved_idx").on(table.resolved),
  ],
);

export type DunningRecord = typeof dunningRecords.$inferSelect;
export type NewDunningRecord = typeof dunningRecords.$inferInsert;

// -----------------------------------------------------------------------------
// Usage Alerts (Tracking sent usage alerts to avoid duplicates)
// -----------------------------------------------------------------------------

export const usageAlertTypes = [
  "links",
  "linksThisMonth",
  "domains",
  "teamMembers",
] as const;
export type UsageAlertType = (typeof usageAlertTypes)[number];

export const usageAlertThresholds = [80, 90, 100] as const;
export type UsageAlertThreshold = (typeof usageAlertThresholds)[number];

export const usageAlerts = sqliteTable(
  "usage_alerts",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    alertType: text("alert_type", { enum: usageAlertTypes }).notNull(),
    threshold: integer("threshold").notNull(), // 80, 90, or 100
    sentAt: text("sent_at").notNull(),
    // Reset period - for monthly limits, we track the month
    periodStart: text("period_start"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("usage_alerts_org_idx").on(table.organizationId),
    index("usage_alerts_user_idx").on(table.userId),
    index("usage_alerts_type_idx").on(table.alertType),
    // Unique constraint to prevent duplicate alerts
    uniqueIndex("usage_alerts_unique_idx").on(
      table.organizationId,
      table.alertType,
      table.threshold,
      table.periodStart,
    ),
  ],
);

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type NewUsageAlert = typeof usageAlerts.$inferInsert;

// -----------------------------------------------------------------------------
// SSO/SAML Configuration (Enterprise)
// -----------------------------------------------------------------------------

export const ssoProviders = ["saml", "oidc"] as const;
export type SSOProvider = (typeof ssoProviders)[number];

export const ssoConfigs = sqliteTable(
  "sso_configs",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ssoProviders }).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    // SAML settings
    entityId: text("entity_id"), // Service Provider Entity ID
    ssoUrl: text("sso_url"), // IdP SSO URL
    sloUrl: text("slo_url"), // IdP SLO URL (optional)
    certificate: text("certificate"), // IdP X.509 Certificate
    // OIDC settings (alternative to SAML)
    oidcIssuer: text("oidc_issuer"),
    oidcClientId: text("oidc_client_id"),
    oidcClientSecret: text("oidc_client_secret"),
    // Domain verification for SSO
    emailDomain: text("email_domain"), // e.g., "company.com"
    enforceSSO: integer("enforce_sso", { mode: "boolean" })
      .notNull()
      .default(false),
    // Auto-provisioning settings
    autoProvision: integer("auto_provision", { mode: "boolean" })
      .notNull()
      .default(true),
    defaultRole: text("default_role", { enum: ["member", "admin"] })
      .notNull()
      .default("member"),
    // Metadata
    metadataUrl: text("metadata_url"), // IdP metadata URL for auto-config
    lastSyncedAt: text("last_synced_at"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("sso_configs_org_idx").on(table.organizationId),
    index("sso_configs_domain_idx").on(table.emailDomain),
  ],
);

export type SSOConfig = typeof ssoConfigs.$inferSelect;
export type NewSSOConfig = typeof ssoConfigs.$inferInsert;

// SSO Sessions for tracking SAML/OIDC sessions
export const ssoSessions = sqliteTable(
  "sso_sessions",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ssoConfigId: text("sso_config_id")
      .notNull()
      .references(() => ssoConfigs.id, { onDelete: "cascade" }),
    sessionIndex: text("session_index"), // SAML SessionIndex for SLO
    nameId: text("name_id"), // SAML NameID
    attributes: text("attributes"), // JSON of SAML attributes
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("sso_sessions_user_idx").on(table.userId),
    index("sso_sessions_config_idx").on(table.ssoConfigId),
  ],
);

export type SSOSession = typeof ssoSessions.$inferSelect;
export type NewSSOSession = typeof ssoSessions.$inferInsert;

// -----------------------------------------------------------------------------
// Audit Logs (Enterprise Compliance)
// -----------------------------------------------------------------------------

export const auditActionTypes = [
  // Authentication
  "auth.login",
  "auth.logout",
  "auth.sso_login",
  "auth.password_change",
  "auth.mfa_enabled",
  "auth.mfa_disabled",
  // Organization
  "org.created",
  "org.updated",
  "org.deleted",
  "org.member_invited",
  "org.member_removed",
  "org.member_role_changed",
  // Links
  "link.created",
  "link.updated",
  "link.deleted",
  "link.archived",
  "link.restored",
  // Domains
  "domain.added",
  "domain.verified",
  "domain.removed",
  // API Keys
  "api_key.created",
  "api_key.revoked",
  // Billing
  "billing.subscription_created",
  "billing.subscription_updated",
  "billing.subscription_canceled",
  "billing.payment_method_updated",
  // Settings
  "settings.sso_configured",
  "settings.webhook_created",
  "settings.webhook_deleted",
  // Data
  "data.exported",
  "data.imported",
] as const;

export type AuditActionType = (typeof auditActionTypes)[number];

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(), // AuditActionType
    resourceType: text("resource_type"), // link, domain, member, etc.
    resourceId: text("resource_id"), // ID of affected resource
    details: text("details"), // JSON with action-specific details
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("audit_logs_org_idx").on(table.organizationId),
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
    index("audit_logs_created_idx").on(table.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// -----------------------------------------------------------------------------
// White-Label / Reseller Program
// -----------------------------------------------------------------------------

export const whiteLabelConfigs = sqliteTable(
  "white_label_configs",
  {
    id: text("id").primaryKey(), // UUID
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    // Branding
    brandName: text("brand_name"),
    logoUrl: text("logo_url"),
    logoLightUrl: text("logo_light_url"), // For dark backgrounds
    faviconUrl: text("favicon_url"),
    primaryColor: text("primary_color").default("#3b82f6"), // Hex color
    secondaryColor: text("secondary_color"),
    // Custom domain for white-label portal
    portalDomain: text("portal_domain"), // e.g., "links.clientbrand.com"
    portalDomainVerified: integer("portal_domain_verified", {
      mode: "boolean",
    }).default(false),
    // Feature toggles
    hidePoweredBy: integer("hide_powered_by", { mode: "boolean" }).default(
      false,
    ),
    customEmailDomain: text("custom_email_domain"), // For sending emails
    customSupportEmail: text("custom_support_email"),
    // Legal
    customTermsUrl: text("custom_terms_url"),
    customPrivacyUrl: text("custom_privacy_url"),
    // Sub-account limits
    maxSubAccounts: integer("max_sub_accounts").default(10),
    subAccountLinkLimit: integer("sub_account_link_limit").default(100),
    // Revenue sharing (for reseller program)
    isReseller: integer("is_reseller", { mode: "boolean" }).default(false),
    revenueSharePercent: integer("revenue_share_percent").default(0), // 0-100%
    stripeConnectAccountId: text("stripe_connect_account_id"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("white_label_org_idx").on(table.organizationId),
    index("white_label_domain_idx").on(table.portalDomain),
  ],
);

export type WhiteLabelConfig = typeof whiteLabelConfigs.$inferSelect;
export type NewWhiteLabelConfig = typeof whiteLabelConfigs.$inferInsert;

// Sub-accounts for resellers
export const whiteLabelSubAccounts = sqliteTable(
  "white_label_sub_accounts",
  {
    id: text("id").primaryKey(), // UUID
    parentOrganizationId: text("parent_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subOrganizationId: text("sub_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customName: text("custom_name"), // Override for this sub-account
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    // Billing
    billedByParent: integer("billed_by_parent", { mode: "boolean" }).default(
      true,
    ),
    monthlyFee: integer("monthly_fee"), // Amount in cents if billed separately
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("wl_sub_parent_idx").on(table.parentOrganizationId),
    index("wl_sub_org_idx").on(table.subOrganizationId),
    uniqueIndex("wl_sub_unique_idx").on(
      table.parentOrganizationId,
      table.subOrganizationId,
    ),
  ],
);

export type WhiteLabelSubAccount = typeof whiteLabelSubAccounts.$inferSelect;
export type NewWhiteLabelSubAccount = typeof whiteLabelSubAccounts.$inferInsert;

// -----------------------------------------------------------------------------
// Affiliate Program
// -----------------------------------------------------------------------------

export const affiliates = sqliteTable(
  "affiliates",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(), // Unique referral code
    commissionRate: real("commission_rate").notNull().default(0.4), // 40% default
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    paypalEmail: text("paypal_email"), // For payouts
    totalEarnings: real("total_earnings").notNull().default(0), // Total earned
    paidEarnings: real("paid_earnings").notNull().default(0), // Already paid out
    pendingEarnings: real("pending_earnings").notNull().default(0), // Awaiting payout
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("affiliates_user_idx").on(table.userId),
    index("affiliates_code_idx").on(table.code),
    index("affiliates_status_idx").on(table.status),
  ],
);

export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert;

export const affiliateReferrals = sqliteTable(
  "affiliate_referrals",
  {
    id: text("id").primaryKey(), // UUID
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    commissionAmount: real("commission_amount"), // Amount earned from this referral
    status: text("status", { enum: ["pending", "paid", "cancelled"] })
      .notNull()
      .default("pending"),
    paidAt: text("paid_at"), // When commission was paid
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("referrals_affiliate_idx").on(table.affiliateId),
    index("referrals_user_idx").on(table.referredUserId),
    index("referrals_status_idx").on(table.status),
  ],
);

export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type NewAffiliateReferral = typeof affiliateReferrals.$inferInsert;

// -----------------------------------------------------------------------------
// Drip Campaigns - Email Lifecycle Automation
// -----------------------------------------------------------------------------

/**
 * Drip campaigns define automated email sequences
 */
export const dripCampaigns = sqliteTable(
  "drip_campaigns",
  {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(), // e.g., "onboarding", "activation", "upgrade"
    description: text("description"),
    trigger: text("trigger").notNull(), // "signup", "trial_start", "inactive", "upgrade_eligible"
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    // Targeting
    targetPlans: text("target_plans"), // JSON array of plans, null = all
    targetUserTypes: text("target_user_types"), // JSON: { isNew: true, hasLinks: false, etc. }
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("drip_campaigns_trigger_idx").on(table.trigger),
    index("drip_campaigns_active_idx").on(table.isActive),
  ],
);

export type DripCampaign = typeof dripCampaigns.$inferSelect;
export type NewDripCampaign = typeof dripCampaigns.$inferInsert;

/**
 * Individual emails within a drip campaign
 */
export const dripEmails = sqliteTable(
  "drip_emails",
  {
    id: text("id").primaryKey(), // UUID
    campaignId: text("campaign_id")
      .notNull()
      .references(() => dripCampaigns.id, { onDelete: "cascade" }),
    // Sequence
    sequence: integer("sequence").notNull(), // Order in the campaign (1, 2, 3...)
    delayMinutes: integer("delay_minutes").notNull().default(0), // Minutes after trigger/previous email
    // Email content
    templateName: text("template_name").notNull(), // Template identifier
    subject: text("subject").notNull(),
    // Conditions
    skipCondition: text("skip_condition"), // JSON: conditions to skip this email
    // Metadata
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("drip_emails_campaign_idx").on(table.campaignId),
    index("drip_emails_sequence_idx").on(table.campaignId, table.sequence),
  ],
);

export type DripEmail = typeof dripEmails.$inferSelect;
export type NewDripEmail = typeof dripEmails.$inferInsert;

/**
 * Track user progress through drip campaigns
 */
export const userDripState = sqliteTable(
  "user_drip_state",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => dripCampaigns.id, { onDelete: "cascade" }),
    // State
    status: text("status").notNull().default("active"), // "active", "completed", "unsubscribed", "paused"
    currentEmailId: text("current_email_id").references(() => dripEmails.id),
    lastEmailSentAt: text("last_email_sent_at"),
    nextEmailAt: text("next_email_at"), // When to send the next email
    emailsSent: integer("emails_sent").notNull().default(0),
    // Tracking
    startedAt: text("started_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    completedAt: text("completed_at"),
    // Metadata
    metadata: text("metadata"), // JSON: any campaign-specific data
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("user_drip_state_user_campaign_idx").on(
      table.userId,
      table.campaignId,
    ),
    index("user_drip_state_status_idx").on(table.status),
    index("user_drip_state_next_email_idx").on(table.nextEmailAt),
  ],
);

export type UserDripState = typeof userDripState.$inferSelect;
export type NewUserDripState = typeof userDripState.$inferInsert;

/**
 * Log of all drip emails sent
 */
export const dripEmailLog = sqliteTable(
  "drip_email_log",
  {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => dripCampaigns.id, { onDelete: "cascade" }),
    emailId: text("email_id")
      .notNull()
      .references(() => dripEmails.id, { onDelete: "cascade" }),
    // Status
    status: text("status").notNull(), // "sent", "failed", "skipped"
    errorMessage: text("error_message"),
    // Engagement
    openedAt: text("opened_at"),
    clickedAt: text("clicked_at"),
    // Timestamps
    sentAt: text("sent_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("drip_email_log_user_idx").on(table.userId),
    index("drip_email_log_campaign_idx").on(table.campaignId),
    index("drip_email_log_sent_idx").on(table.sentAt),
  ],
);

export type DripEmailLog = typeof dripEmailLog.$inferSelect;
export type NewDripEmailLog = typeof dripEmailLog.$inferInsert;

// -----------------------------------------------------------------------------
// User Preferences (App Settings)
// -----------------------------------------------------------------------------

/**
 * User preferences for app settings.
 * Stores user-specific defaults and UI preferences.
 */
export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // Link creation defaults
  defaultDomainId: text("default_domain_id").references(() => domains.id, {
    onDelete: "set null",
  }),
  defaultTrackAnalytics: integer("default_track_analytics", {
    mode: "boolean",
  }).default(true),
  defaultPublicStats: integer("default_public_stats", {
    mode: "boolean",
  }).default(false),
  defaultFolderId: text("default_folder_id"),

  // Notification preferences
  emailNotificationsEnabled: integer("email_notifications_enabled", {
    mode: "boolean",
  }).default(true),
  emailUsageAlerts: integer("email_usage_alerts", { mode: "boolean" }).default(
    true,
  ),
  emailWeeklyDigest: integer("email_weekly_digest", {
    mode: "boolean",
  }).default(false),
  emailMarketing: integer("email_marketing", { mode: "boolean" }).default(true),

  // Appearance preferences
  theme: text("theme").default("system"), // "light" | "dark" | "system"
  defaultTimeRange: text("default_time_range").default("30d"), // "7d" | "30d" | "90d" | "all"
  itemsPerPage: integer("items_per_page").default(25),

  // Timestamps
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

// -----------------------------------------------------------------------------
// Contact Submissions (Contact Form Tracking)
// -----------------------------------------------------------------------------

export const contactSubmissionStatuses = [
  "new",
  "read",
  "replied",
  "archived",
] as const;
export type ContactSubmissionStatus = (typeof contactSubmissionStatuses)[number];

export const contactSubmissions = sqliteTable(
  "contact_submissions",
  {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    source: text("source").default("website"), // website, enterprise, support, etc.
    status: text("status", { enum: contactSubmissionStatuses })
      .notNull()
      .default("new"),
    // Response tracking
    respondedAt: text("responded_at"),
    respondedBy: text("responded_by"),
    // Metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // If user was logged in
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("contact_submissions_email_idx").on(table.email),
    index("contact_submissions_status_idx").on(table.status),
    index("contact_submissions_created_idx").on(table.createdAt),
  ],
);

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;

// -----------------------------------------------------------------------------
// Support Tickets (Support Request Tracking)
// -----------------------------------------------------------------------------

export const supportTicketCategories = [
  "how_to",
  "bug_report",
  "billing",
  "feature_request",
  "account",
  "api",
  "urgent",
  "enterprise",
  "other",
] as const;
export type SupportTicketCategory = (typeof supportTicketCategories)[number];

export const supportTicketStatuses = [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
] as const;
export type SupportTicketStatus = (typeof supportTicketStatuses)[number];

export const supportTicketPriorities = ["low", "medium", "high", "urgent"] as const;
export type SupportTicketPriority = (typeof supportTicketPriorities)[number];

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(), // UUID
    // User info (may be anonymous)
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    // Ticket details
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    category: text("category", { enum: supportTicketCategories })
      .notNull()
      .default("other"),
    priority: text("priority", { enum: supportTicketPriorities })
      .notNull()
      .default("medium"),
    status: text("status", { enum: supportTicketStatuses })
      .notNull()
      .default("open"),
    // AI response (if any)
    aiResponse: text("ai_response"),
    aiResponseHelpful: integer("ai_response_helpful", { mode: "boolean" }),
    // Assignment
    assignedTo: text("assigned_to"),
    // Response tracking
    firstResponseAt: text("first_response_at"),
    resolvedAt: text("resolved_at"),
    // Metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"), // JSON for additional data
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("support_tickets_user_idx").on(table.userId),
    index("support_tickets_email_idx").on(table.email),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_category_idx").on(table.category),
    index("support_tickets_priority_idx").on(table.priority),
    index("support_tickets_created_idx").on(table.createdAt),
  ],
);

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

// -----------------------------------------------------------------------------
// Newsletter Subscribers (Mailing List)
// -----------------------------------------------------------------------------

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull().unique(),
    name: text("name"),
    source: text("source").default("website"), // website, footer, blog, enterprise, etc.
    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    unsubscribedAt: text("unsubscribed_at"),
    // Email preferences
    emailPreferences: text("email_preferences"), // JSON: { product_updates: true, blog: true, etc. }
    // Tracking
    confirmedAt: text("confirmed_at"),
    lastEmailAt: text("last_email_at"),
    // Metadata
    ipAddress: text("ip_address"),
    // Timestamps
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(table.email),
    index("newsletter_subscribers_active_idx").on(table.isActive),
    index("newsletter_subscribers_source_idx").on(table.source),
  ],
);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * Pricing Configuration
 *
 * Go2 URL Shortener pricing plans and features.
 * Based on market research - competitive with Dub.co, Bitly, Short.io
 */

export interface PricingFeature {
  /** Feature name */
  name: string;
  /** Whether included in plan */
  included: boolean;
  /** Optional limit (e.g., "5 users", "10GB") */
  limit?: string;
  /** Tooltip/help text */
  tooltip?: string;
}

export interface PricingPlan {
  /** Unique plan ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Monthly price in dollars (null for custom/enterprise) */
  priceMonthly: number | null;
  /** Annual price in dollars (null for custom/enterprise) */
  priceAnnual: number | null;
  /** Stripe price ID for monthly billing */
  stripePriceIdMonthly: string | null;
  /** Stripe price ID for annual billing */
  stripePriceIdAnnual: string | null;
  /**
   * Stripe metered price ID for usage overage, attached as a second
   * subscription item. Graduated tiers bill the plan's included quota at $0
   * and every attributed event above it at $0.40/1,000. null = no overage
   * (Free upgrades instead; Scale is already pure usage).
   */
  stripeOveragePriceId: string | null;
  /** Marketing-friendly features for cards (keep concise) */
  features: PricingFeature[];
  /** Highlight this plan as recommended */
  recommended?: boolean;
  /** CTA button text */
  cta: string;
  /** CTA button link (null = checkout) */
  ctaLink?: string | null;
}

export const pricingConfig = {
  /** Headline for pricing section */
  headline: "Simple, transparent pricing",
  /** Subheadline */
  subheadline: "Start free, upgrade when you need more. No hidden fees, cancel anytime.",
  /** Show annual/monthly toggle */
  showAnnualToggle: true,
  /** Annual discount percentage (for display) */
  annualDiscount: 20,
  /** Currency symbol */
  currency: "$",
  /** Contact email for enterprise inquiries */
  enterpriseEmail: "enterprise@go2.gg",
};

// Marketing-friendly features for pricing cards (concise)
// Copy is reframed for the AI-startup buyer per WINNING_PATH.md
export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For solo builders trying it out — no credit card",
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    stripeOveragePriceId: null,
    cta: "Install the MCP server",
    ctaLink: "/agents/quickstart",
    features: [
      { name: "Tracked links", included: true, limit: "100/month" },
      { name: "Attributed clicks", included: true, limit: "5K/month" },
      { name: "Per-run agent attribution", included: true },
      { name: "MCP server (stdio + remote)", included: true },
      { name: "REST API + OpenAPI", included: true },
      { name: "1 custom domain", included: true },
      { name: "Community support", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Indie builders, agencies, and small teams shipping daily",
    priceMonthly: 9,
    priceAnnual: 86,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_1TgyYu43jurh1T6btCXxDvfE",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "price_1TgyYu43jurh1T6bVJMu9GM9",
    stripeOveragePriceId: process.env.STRIPE_OVERAGE_PRICE_PRO ?? "price_1Tgyz443jurh1T6bM87ZdrWG",
    recommended: true,
    cta: "Start 14-day trial",
    features: [
      { name: "Tracked links", included: true, limit: "2K/month" },
      { name: "Attributed clicks", included: true, limit: "100K/month" },
      { name: "Everything in Free", included: true },
      { name: "Revocable + expiring agent links", included: true },
      { name: "Custom domains", included: true, limit: "5" },
      { name: "Team seats", included: true, limit: "3" },
      { name: "Webhooks + pixels", included: true },
      { name: "Geo + device targeting", included: true },
      { name: "1-year analytics retention", included: true },
      { name: "Priority support", included: true },
      { name: "Usage overage", included: true, limit: "$0.40/1K events beyond 100K" },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Growing teams with custom domains, SSO, and longer retention",
    priceMonthly: 49,
    priceAnnual: 470,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "price_1TgyYw43jurh1T6brxnKqpg6",
    stripePriceIdAnnual:
      process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? "price_1TgyYx43jurh1T6bkOVdlYup",
    stripeOveragePriceId:
      process.env.STRIPE_OVERAGE_PRICE_BUSINESS ?? "price_1Tgyz643jurh1T6brEf93srV",
    cta: "Get started",
    features: [
      { name: "Tracked links", included: true, limit: "20K/month" },
      { name: "Attributed clicks", included: true, limit: "500K/month" },
      { name: "Everything in Pro", included: true },
      { name: "A/B testing + conversion tracking", included: true },
      { name: "SAML SSO + audit logs", included: true },
      { name: "Role-based access control", included: true },
      { name: "Custom domains", included: true, limit: "25" },
      { name: "Team seats", included: true, limit: "10" },
      { name: "2-year analytics retention", included: true },
      { name: "Dedicated support + 99.9% SLA", included: true },
      { name: "Usage overage", included: true, limit: "$0.40/1K events beyond 500K" },
    ],
  },
  {
    id: "scale",
    name: "Scale",
    description: "High-volume operations — 1M events/mo included, then usage-based",
    priceMonthly: 99,
    priceAnnual: 950,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_SCALE_MONTHLY ?? "price_1Th1xP43jurh1T6bHJsjxMIm",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_SCALE_ANNUAL ?? "price_1Th1xQ43jurh1T6bQrTPjDFS",
    stripeOveragePriceId:
      process.env.STRIPE_OVERAGE_PRICE_SCALE ?? "price_1Th1xR43jurh1T6b0AIPKr9z",
    cta: "Get started",
    features: [
      { name: "Everything in Business", included: true },
      { name: "Attributed events", included: true, limit: "1M/mo included" },
      { name: "Usage overage", included: true, limit: "$0.40/1K events beyond 1M" },
      { name: "Volume discounts at 10M+ events/mo", included: true },
      { name: "5-year analytics retention", included: true },
      { name: "Priority engineering support", included: true },
      { name: "AGPL self-host or commercial license", included: true },
    ],
  },
];

// Detailed comparison table for full feature breakdown
export interface ComparisonCategory {
  name: string;
  features: {
    name: string;
    tooltip?: string;
    free: string | boolean;
    pro: string | boolean;
    business: string | boolean;
  }[];
}

export const comparisonTable: ComparisonCategory[] = [
  {
    name: "Links & Redirects",
    features: [
      { name: "New links", free: "100/mo", pro: "2K/mo", business: "20K/mo" },
      { name: "Tracked clicks", free: "5K/mo", pro: "100K/mo", business: "500K/mo" },
      { name: "Edge runtime (<10ms)", free: true, pro: true, business: true },
      { name: "Automatic SSL", free: true, pro: true, business: true },
      { name: "Custom slugs", free: true, pro: true, business: true },
      { name: "Link expiration", free: false, pro: true, business: true },
      { name: "Password protection", free: false, pro: true, business: true },
      { name: "Link cloaking", free: false, pro: true, business: true },
      { name: "Click limits", free: false, pro: true, business: true },
    ],
  },
  {
    name: "Targeting & Routing",
    features: [
      { name: "Geo targeting", free: false, pro: true, business: true },
      { name: "Device targeting", free: false, pro: true, business: true },
      { name: "Deep links (iOS/Android)", free: false, pro: true, business: true },
      { name: "UTM builder", free: true, pro: true, business: true },
      { name: "A/B testing", free: false, pro: false, business: true },
    ],
  },
  {
    name: "Analytics & Insights",
    features: [
      { name: "Basic analytics", free: true, pro: true, business: true },
      { name: "Device & geo data", free: false, pro: true, business: true },
      { name: "Referrer tracking", free: false, pro: true, business: true },
      { name: "Export data (CSV)", free: false, pro: true, business: true },
      { name: "Real-time dashboard", free: true, pro: true, business: true },
      { name: "Conversion tracking", free: false, pro: false, business: true },
      { name: "Retention", free: "30 days", pro: "1 year", business: "2 years" },
    ],
  },
  {
    name: "Branding & Domains",
    features: [
      { name: "Custom domains", free: "1", pro: "5", business: "25" },
      { name: "QR codes", free: true, pro: true, business: true },
      { name: "Branded QR codes", free: false, pro: true, business: true },
      { name: "Custom OG previews", free: false, pro: true, business: true },
      { name: "Link-in-bio pages", free: false, pro: "1", business: "10" },
    ],
  },
  {
    name: "Integrations",
    features: [
      { name: "REST API", free: true, pro: true, business: true },
      { name: "API rate limit", free: "100/min", pro: "1K/min", business: "3K/min" },
      { name: "Webhooks", free: false, pro: true, business: true },
      { name: "Pixel tracking", free: false, pro: true, business: true },
      { name: "Folders", free: false, pro: "5", business: "25" },
      { name: "Tags", free: "5", pro: "25", business: "Unlimited" },
    ],
  },
  {
    name: "Team & Support",
    features: [
      { name: "Team members", free: "1", pro: "3", business: "10" },
      { name: "Role-based access", free: false, pro: false, business: true },
      { name: "SAML SSO", free: false, pro: false, business: true },
      { name: "Audit logs", free: false, pro: false, business: true },
      { name: "Community support", free: true, pro: true, business: true },
      { name: "Priority email support", free: false, pro: true, business: true },
      { name: "Dedicated support", free: false, pro: false, business: true },
      { name: "SLA (99.9%)", free: false, pro: false, business: true },
    ],
  },
];

/**
 * Get a plan by ID
 */
export function getPlan(planId: string): PricingPlan | undefined {
  return pricingPlans.find((plan) => plan.id === planId);
}

/**
 * Get the Stripe price ID for a plan
 */
export function getStripePriceId(planId: string, annual: boolean): string | null {
  const plan = getPlan(planId);
  if (!plan) return null;
  return annual ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
}

/**
 * Resolve the metered overage price ID for a plan, given one of its flat
 * (monthly or annual) price IDs. Returns null when the plan has no overage
 * SKU — Free, Scale, or an unrecognized price.
 */
export function getOveragePriceIdForPrice(flatPriceId: string): string | null {
  const plan = pricingPlans.find(
    (p) => p.stripePriceIdMonthly === flatPriceId || p.stripePriceIdAnnual === flatPriceId
  );
  return plan?.stripeOveragePriceId ?? null;
}

/**
 * Plan limits for enforcement
 *
 * Following industry-standard model (like Dub.co):
 * - linksPerMonth: New links you can create per month
 * - trackedClicksPerMonth: Clicks that get tracked/analyzed per month
 *
 * Note: All plans have concrete limits. No "unlimited" values.
 * Tags with -1 means unlimited.
 */
export const planLimits = {
  free: {
    linksPerMonth: 100,
    trackedClicksPerMonth: 5000,
    domains: 1,
    analyticsRetentionDays: 30,
    apiRateLimit: 100,
    teamMembers: 1,
    bioPages: 0,
    tags: 5,
    folders: 0,
    // Free links auto-expire after this many days from createdAt.
    // null = never (paid tiers). 0 = expires immediately (do not use).
    linkRetentionDays: 60 as number | null,
  },
  pro: {
    linksPerMonth: 2000,
    trackedClicksPerMonth: 100000,
    domains: 5,
    analyticsRetentionDays: 365,
    apiRateLimit: 1000,
    teamMembers: 3,
    bioPages: 1,
    tags: 25,
    folders: 5,
    linkRetentionDays: null as number | null,
  },
  business: {
    linksPerMonth: 20000,
    trackedClicksPerMonth: 500000,
    domains: 25,
    analyticsRetentionDays: 730,
    apiRateLimit: 3000,
    teamMembers: 10,
    bioPages: 10,
    tags: -1, // Unlimited
    folders: 25,
    linkRetentionDays: null as number | null,
  },
  scale: {
    // Scale is usage-based: tracked clicks above the included 1M/mo bill
    // through the Stripe meter rather than being blocked, so the click limit
    // here is a high abuse backstop, not a product wall.
    linksPerMonth: 100000,
    trackedClicksPerMonth: 50000000,
    domains: 100,
    analyticsRetentionDays: 1825, // 5 years
    apiRateLimit: 10000,
    teamMembers: 100,
    bioPages: 100,
    tags: -1, // Unlimited
    folders: -1, // Unlimited
    linkRetentionDays: null as number | null,
  },
  enterprise: {
    // Enterprise gets high but concrete limits
    // Custom limits can be set via admin for specific orgs
    linksPerMonth: 100000,
    trackedClicksPerMonth: 2000000,
    domains: 100,
    analyticsRetentionDays: 1825, // 5 years
    apiRateLimit: 10000,
    teamMembers: 100,
    bioPages: 100,
    tags: -1, // Unlimited
    folders: -1, // Unlimited
    linkRetentionDays: null as number | null,
  },
} as const;

export type PlanId = keyof typeof planLimits;

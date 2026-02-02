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
export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for personal projects and testing",
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    cta: "Start free",
    ctaLink: "/register",
    features: [
      { name: "New links", included: true, limit: "50/month" },
      { name: "Tracked clicks", included: true, limit: "2K/month" },
      { name: "Custom domain", included: true, limit: "1" },
      { name: "Analytics", included: true, limit: "30 days" },
      { name: "QR codes", included: true },
      { name: "API access", included: true },
      { name: "Community support", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For creators and developers who need more",
    priceMonthly: 9,
    priceAnnual: 86,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_1StPxBKhC7le8Qv5GZJLpbSE",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "price_1StPxCKhC7le8Qv5tZmIkrfr",
    recommended: true,
    cta: "Start 14-day trial",
    features: [
      { name: "New links", included: true, limit: "2K/month" },
      { name: "Tracked clicks", included: true, limit: "100K/month" },
      { name: "Custom domains", included: true, limit: "5" },
      { name: "Analytics", included: true, limit: "1 year" },
      { name: "Password & expiration", included: true },
      { name: "Geo & device targeting", included: true },
      { name: "Webhooks & pixels", included: true },
      { name: "Link-in-bio page", included: true },
      { name: "Priority support", included: true },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and growing businesses",
    priceMonthly: 49,
    priceAnnual: 470,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "price_1SviefKhC7le8Qv5J0S9rtEG",
    stripePriceIdAnnual:
      process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? "price_1SvielKhC7le8Qv59j7SgNkS",
    cta: "Get started",
    features: [
      { name: "New links", included: true, limit: "20K/month" },
      { name: "Tracked clicks", included: true, limit: "500K/month" },
      { name: "Custom domains", included: true, limit: "25" },
      { name: "Analytics", included: true, limit: "2 years" },
      { name: "Everything in Pro", included: true },
      { name: "A/B testing", included: true },
      { name: "Conversion tracking", included: true },
      { name: "Team members", included: true, limit: "10 seats" },
      { name: "Dedicated support", included: true },
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
      { name: "New links", free: "50/mo", pro: "2K/mo", business: "20K/mo" },
      { name: "Tracked clicks", free: "2K/mo", pro: "100K/mo", business: "500K/mo" },
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
      { name: "Team members", free: "1", pro: "1", business: "10" },
      { name: "Role-based access", free: false, pro: false, business: true },
      { name: "Community support", free: true, pro: true, business: true },
      { name: "Priority email support", free: false, pro: true, business: true },
      { name: "Dedicated support", free: false, pro: false, business: true },
      { name: "SLA (99.99%)", free: false, pro: false, business: true },
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
    linksPerMonth: 50,
    trackedClicksPerMonth: 2000,
    domains: 1,
    analyticsRetentionDays: 30,
    apiRateLimit: 100,
    teamMembers: 1,
    bioPages: 0,
    tags: 5,
    folders: 0,
  },
  pro: {
    linksPerMonth: 2000,
    trackedClicksPerMonth: 100000,
    domains: 5,
    analyticsRetentionDays: 365,
    apiRateLimit: 1000,
    teamMembers: 1,
    bioPages: 1,
    tags: 25,
    folders: 5,
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
  },
} as const;

export type PlanId = keyof typeof planLimits;

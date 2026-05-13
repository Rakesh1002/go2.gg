/**
 * Brand Configuration
 *
 * Centralized brand messaging, stats, taglines, and CTAs.
 * This is the single source of truth for all marketing copy.
 */

// =============================================================================
// CORE POSITIONING
// =============================================================================

export const brandPositioning = {
  /** Primary tagline used across the site */
  tagline: "The Edge-Native Link Platform",

  /** Alternative taglines for specific contexts */
  taglines: {
    hero: "Shorten links. Track everything.",
    footer: "The fastest link shortener on the planet.",
    speed: "Links at the speed of light.",
  },

  /** Core value proposition */
  valueProposition:
    "Go2 is the fastest, developer-first link platform built on Cloudflare's edge network.",

  /** Short description for SEO and meta */
  description:
    "Go2 is the modern URL shortener built for speed. Powered by Cloudflare's edge network for sub-10ms redirects. Open source, developer-ready, and privacy-first.",
} as const;

// =============================================================================
// STANDARDIZED STATS
// =============================================================================

export const brandStats = {
  /** Redirect speed - use consistently across all pages */
  redirectSpeed: "<10ms",
  redirectSpeedLabel: "Sub-10ms redirects globally",

  /** Edge locations - use consistently across all pages */
  edgeLocations: "310+",
  edgeLocationsLabel: "Edge locations worldwide",

  /** Links shortened - update periodically */
  linksShortened: "50M+",
  linksShortenedLabel: "Links shortened",

  /** Uptime SLA */
  uptime: "99.99%",
  uptimeLabel: "Uptime SLA",

  /** Stats for different contexts */
  heroStats: [
    { value: "<10ms", label: "Redirect speed" },
    { value: "310+", label: "Edge locations" },
    { value: "50M+", label: "Links shortened" },
  ],

  dashboardStats: [
    {
      value: "50M+",
      label: "Links shortened",
      description: "Growing every second",
    },
    {
      value: "<10ms",
      label: "Redirect speed",
      description: "Globally on edge network",
    },
    {
      value: "310+",
      label: "Edge locations",
      description: "Worldwide coverage",
    },
    {
      value: "99.99%",
      label: "Uptime SLA",
      description: "Enterprise reliability",
    },
  ],
} as const;

// =============================================================================
// ONBOARDING & TRIAL MODEL
// =============================================================================

export const trialConfig = {
  /** Trial duration in days */
  durationDays: 14,

  /** Trial model description */
  model: "pro-trial" as const,

  /** Key messaging for trial */
  messaging: {
    headline: "Try Pro free for 14 days",
    subheadline: "No credit card required",
    afterTrial: "Keep Pro or continue free after your trial",
  },

  /** Trust indicators for trial */
  trustIndicators: ["14-day Pro trial", "No credit card required", "Keep Pro or continue free"],
} as const;

// =============================================================================
// STANDARDIZED CTAS
// =============================================================================

export const brandCTAs = {
  /** Primary CTA - used in hero, headers, main sections */
  primary: {
    text: "Start free",
    href: "/register",
  },

  /** Alternative primary CTAs */
  primaryAlt: {
    text: "Try Pro free",
    href: "/register",
  },

  /** Secondary CTA - used alongside primary */
  secondary: {
    text: "View docs",
    href: "/docs",
  },

  /** Book demo CTA - for enterprise/sales */
  demo: {
    text: "Book a demo",
    href: "/contact",
  },

  /** Developer-focused CTA */
  developer: {
    text: "Start building",
    href: "/docs/quickstart",
  },

  /** Pricing page CTAs */
  pricing: {
    trial: { text: "Start 14-day trial", href: "/register" },
    free: { text: "Continue on Free", href: "/register" },
    enterprise: { text: "Contact sales", href: "/contact" },
  },

  /** Header CTA */
  header: {
    signIn: { text: "Sign in", href: "/login" },
    getStarted: { text: "Start free", href: "/register" },
  },
} as const;

// =============================================================================
// VALUE PROPS
// =============================================================================

export const valueProps = {
  speed: {
    headline: "Sub-10ms redirects globally",
    description: "Built on Cloudflare's edge network for the fastest redirects possible.",
  },
  edgeLocations: {
    headline: "310+ edge locations worldwide",
    description: "Your links are served from the closest edge location to your users.",
  },
  uptime: {
    headline: "99.99% uptime SLA",
    description: "Enterprise-grade reliability backed by Cloudflare's infrastructure.",
  },
  openSource: {
    headline: "Open source and self-hostable",
    description: "Full transparency with the option to run on your own infrastructure.",
  },
  privacy: {
    headline: "Privacy-first, GDPR compliant",
    description: "No invasive tracking. Your data stays yours.",
  },
  api: {
    headline: "Developer-friendly REST API",
    description: "Full programmatic control with comprehensive documentation.",
  },
} as const;

// =============================================================================
// BRAND VOICE ATTRIBUTES
// =============================================================================

export const brandVoice = {
  /** Tone characteristics */
  attributes: [
    "Confident: State facts, not hype",
    "Technical: Developer-first language, specific metrics",
    "Direct: Clear, concise, no fluff",
    "Trustworthy: Transparent pricing, open source, privacy-first",
  ],

  /** Do's and Don'ts */
  guidelines: {
    do: [
      "Use specific metrics (e.g., 'Sub-10ms redirects' not 'blazingly fast')",
      "Lead with developer benefits",
      "Be transparent about pricing and limitations",
      "Emphasize speed, reliability, and privacy",
    ],
    dont: [
      "Use vague superlatives",
      "Over-promise or hype",
      "Hide pricing or features behind walls",
      "Use dark patterns or manipulative copy",
    ],
  },
} as const;

// =============================================================================
// SECTION HEADLINES
// =============================================================================

export const sectionHeadlines = {
  features: {
    headline: "Everything you need to manage links",
    subheadline: "Powerful tools for developers, marketers, and teams.",
  },
  analytics: {
    headline: "Turn clicks into actionable insights",
    subheadline: "Track every interaction in real-time with detailed breakdowns.",
  },
  speed: {
    headline: "Engineered for extreme speed",
    subheadline: "Powered by Cloudflare Workers for sub-10ms redirects worldwide.",
  },
  cta: {
    headline: "Start shortening links in seconds",
    subheadline: "Join thousands of developers and teams already using Go2.",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BrandCTA = { text: string; href: string };
export type BrandStat = { value: string; label: string; description?: string };

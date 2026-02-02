/**
 * Features Configuration
 *
 * Define product features for the landing page and features page.
 */

export interface Feature {
  /** Unique feature ID */
  id: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Lucide icon name (e.g., "Zap", "Shield", "CreditCard") */
  icon: string;
  /** Optional link to learn more */
  link?: string;
  /** Category for grouping */
  category?: string;
}

export const featuresConfig = {
  /** Headline for features section */
  headline: "Everything you need to share smarter",
  /** Subheadline */
  subheadline:
    "Short links that load instantly, analytics that tell the whole story, and features that grow with you.",
};

export const features: Feature[] = [
  // Core Features
  {
    id: "edge-redirects",
    title: "Lightning Fast Links",
    description:
      "Your links load before you can blink. We're 10x faster than other shorteners because speed matters for your audience.",
    icon: "Zap",
    category: "core",
  },
  {
    id: "custom-domains",
    title: "Your Brand, Your Domain",
    description:
      "Use your own domain like links.yourcompany.com. Your audience sees your brand, not ours. Free on every plan.",
    icon: "Globe",
    category: "core",
  },
  {
    id: "analytics",
    title: "Know Your Audience",
    description:
      "See who's clicking, where they're from, and what devices they use. Real-time insights that help you make smarter decisions.",
    icon: "BarChart",
    category: "core",
  },
  {
    id: "qr-codes",
    title: "Beautiful QR Codes",
    description:
      "Create stunning QR codes with custom colors and logos. Our AI can even generate artistic designs that people actually want to scan.",
    icon: "QrCode",
    category: "core",
  },

  // Advanced Features
  {
    id: "link-management",
    title: "Organize Your Links",
    description:
      "Tags, folders, custom names — keep everything tidy. Set links to expire, limit clicks, or add passwords when you need control.",
    icon: "Link",
    category: "advanced",
  },
  {
    id: "geo-targeting",
    title: "Smart Routing",
    description:
      "Send iPhone users to the App Store and Android users to Google Play. Or route visitors by country for localized experiences.",
    icon: "MapPin",
    category: "advanced",
  },
  {
    id: "retargeting",
    title: "Retarget Your Visitors",
    description:
      "Add Facebook, Google, TikTok, and LinkedIn pixels to your links. Build audiences from every click and bring them back.",
    icon: "Target",
    category: "advanced",
  },
  {
    id: "conversions",
    title: "Track What Matters",
    description:
      "See exactly how clicks turn into signups, purchases, and revenue. Know which links are driving real business results.",
    icon: "TrendingUp",
    category: "advanced",
  },

  // Enterprise Features
  {
    id: "team",
    title: "Built for Teams",
    description:
      "Invite your team with the right permissions. Everyone stays organized, and you keep control of who can do what.",
    icon: "Users",
    category: "enterprise",
  },
  {
    id: "security",
    title: "Serious About Security",
    description:
      "Password-protected links, single sign-on, and protection against abuse. Your data and your visitors are always safe.",
    icon: "Shield",
    category: "enterprise",
  },
  {
    id: "webhooks",
    title: "Connect Everything",
    description:
      "Get instant notifications when links are clicked. Connect to Slack, Zapier, or any tool you already use.",
    icon: "Webhook",
    category: "enterprise",
  },
  {
    id: "migration",
    title: "Switch in Seconds",
    description:
      "Moving from Bitly, Rebrandly, or Short.io? Import all your links with one click. We make switching painless.",
    icon: "ArrowRightLeft",
    category: "enterprise",
  },
];

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): Feature[] {
  return features.filter((f) => f.category === category);
}

/**
 * Feature categories for display
 */
export const featureCategories = [
  { id: "core", name: "The Essentials", description: "Everything you need to get started" },
  { id: "advanced", name: "Power Features", description: "For serious marketers and creators" },
  { id: "enterprise", name: "For Teams", description: "Collaboration and security at scale" },
];

/**
 * Key stats for the landing page
 */
export const keyStats = [
  { value: "10ms", label: "Lightning Fast", description: "10x faster than others" },
  { value: "310+", label: "Global Reach", description: "Locations worldwide" },
  { value: "99.99%", label: "Always On", description: "Guaranteed uptime" },
  { value: "Free", label: "No Surprises", description: "50 links to start" },
];

/**
 * Use cases for the landing page
 */
export const useCases = [
  {
    id: "marketing",
    title: "Marketers",
    description: "Track every campaign click and see what's actually working. No more guessing.",
    icon: "Megaphone",
  },
  {
    id: "developers",
    title: "Developers",
    description: "A real API, webhooks, and no rate limit surprises. Build what you want.",
    icon: "Terminal",
  },
  {
    id: "agencies",
    title: "Agencies",
    description: "Give each client their own branded domain. Look professional, always.",
    icon: "Building",
  },
  {
    id: "creators",
    title: "Creators",
    description: "Beautiful link-in-bio pages, AI QR codes, and analytics that help you grow.",
    icon: "Sparkles",
  },
];

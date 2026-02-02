/**
 * FAQ Configuration
 *
 * Frequently asked questions for Go2 URL shortener.
 */

export interface FAQItem {
  /** Unique ID */
  id: string;
  /** Question */
  question: string;
  /** Answer (supports markdown) */
  answer: string;
  /** Category for grouping */
  category?: string;
}

export const faqConfig = {
  /** Headline for FAQ section */
  headline: "Frequently asked questions",
  /** Subheadline */
  subheadline:
    "Everything you need to know about Go2. Can't find the answer you're looking for? Contact our support team.",
  /** Contact email for additional questions */
  contactEmail: "support@go2.gg",
};

/**
 * Empty boilerplate FAQs (not applicable for Go2)
 */
export const boilerplateFAQItems: FAQItem[] = [];

/**
 * FAQs for Go2 URL shortener
 */
export const faqItems: FAQItem[] = [
  // General
  {
    id: "what-is-go2",
    question: "What is Go2?",
    answer:
      "Go2 is the fastest URL shortener on the internet. Built on Cloudflare's global edge network, Go2 delivers sub-10ms redirects from 310+ locations worldwide. Create short links, track analytics, and use custom domains—all with a simple, developer-friendly platform.",
    category: "general",
  },
  {
    id: "why-faster",
    question: "Why is Go2 faster than other URL shorteners?",
    answer:
      "Traditional URL shorteners route requests through a central server, adding latency. Go2 is edge-native—your links live in Cloudflare Workers, milliseconds from your users. No origin server round-trip means sub-10ms redirects globally, compared to 50-100ms for competitors like Bitly.",
    category: "general",
  },
  {
    id: "custom-domains",
    question: "Can I use my own domain?",
    answer:
      "Yes! With Go2 Pro and Business plans, you can add custom domains like links.yourbrand.com. Just add a DNS record and we handle the rest. Your links, your brand.",
    category: "general",
  },
  {
    id: "free-tier",
    question: "What's included in the free tier?",
    answer:
      "Our free tier includes 50 links, basic analytics (clicks, countries, referrers), QR code generation, and full API access. No credit card required. Perfect for personal projects and getting started.",
    category: "general",
  },

  // Pricing
  {
    id: "pricing",
    question: "How much does Go2 cost?",
    answer:
      "Go2 offers simple pricing: Free (50 links), Pro ($9/mo, 500 links/month + 5 custom domains), and Business ($49/mo, 5,000 links/month + team features). Need more? Contact sales for custom enterprise plans.",
    category: "pricing",
  },
  {
    id: "free-trial",
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes! The Pro plan includes a 14-day free trial with full access to all Pro features. No credit card required to start. Business plan requires a subscription from day one but includes all Pro features plus team collaboration, A/B testing, and advanced analytics.",
    category: "pricing",
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Cancel your subscription anytime from your dashboard—no contracts, no cancellation fees, no hassle. Your links continue working until the end of your billing period.",
    category: "pricing",
  },
  {
    id: "price-increase",
    question: "Will my price ever increase?",
    answer:
      "No. Go2 offers a Price Stability Pledge—your price is locked forever. If we raise prices for new customers, existing customers keep their current rate. Early adopters are always rewarded.",
    category: "pricing",
  },

  // Technical
  {
    id: "analytics",
    question: "What analytics are available?",
    answer:
      "Go2 provides real-time analytics including click counts, geographic data (country/city), device types, browsers, operating systems, and referrer sources. Pro and Business plans include extended data retention and advanced filtering.",
    category: "technical",
  },
  {
    id: "api",
    question: "Is there an API?",
    answer:
      "Yes! Go2 is API-first. Every feature available in the dashboard is accessible via our REST API. Create links, manage domains, and retrieve analytics programmatically. Full API documentation at go2.gg/docs.",
    category: "technical",
  },
  {
    id: "qr-codes",
    question: "Can I generate QR codes?",
    answer:
      "Yes! Every short link comes with an automatically generated QR code. Download in PNG or SVG format, customize colors, and add to your marketing materials.",
    category: "technical",
  },
  {
    id: "link-expiration",
    question: "Can links expire?",
    answer:
      "Yes. Set an expiration date when creating a link, and it will automatically stop redirecting after that date. Great for time-limited promotions and campaigns.",
    category: "technical",
  },

  // Support
  {
    id: "support",
    question: "How do I get help?",
    answer:
      "We offer multiple support channels: documentation at go2.gg/docs, email support at support@go2.gg, and priority support for Pro/Business customers. Enterprise plans include dedicated support.",
    category: "support",
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Yes. Go2 uses industry-standard encryption, runs on Cloudflare's security infrastructure, and never shares your data with third parties. We're committed to privacy and transparency.",
    category: "support",
  },
  {
    id: "link-permanence",
    question: "What happens to my links if I cancel?",
    answer:
      "We believe in link permanence. If you cancel, you have 30 days to export your links. We also offer a self-hosting option for total control. Your links, your data, always.",
    category: "support",
  },
];

/**
 * Get FAQ items by category
 */
export function getFAQByCategory(category: string): FAQItem[] {
  return faqItems.filter((item) => item.category === category);
}

/**
 * Get boilerplate FAQ items by category (empty for Go2)
 */
export function getBoilerplateFAQByCategory(_category: string): FAQItem[] {
  return [];
}

/**
 * FAQ categories for display
 */
export const faqCategories = [
  { id: "general", name: "General" },
  { id: "pricing", name: "Pricing" },
  { id: "technical", name: "Technical" },
  { id: "support", name: "Support" },
];

/**
 * Empty boilerplate FAQ categories (not applicable for Go2)
 */
export const boilerplateFAQCategories: { id: string; name: string }[] = [];

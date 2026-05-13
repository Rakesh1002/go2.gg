import type { Metadata } from "next";
import { getMetadata, siteConfig, pricingPlans } from "@repo/config";
import type { FAQItem } from "@repo/config";
import { PricingSection, FAQSection, CTA } from "@/components/marketing/sections";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Pricing — Free, Pro, Business, Scale",
    description:
      "Free for 100 links a month — no credit card. $9/mo when you outgrow it. $49/mo for teams with custom domains, SSO, and longer retention. Usage-based at $0.40 per 1K events at scale. AGPL self-host.",
  }),
  alternates: { canonical: `${siteConfig.url}/pricing` },
};

const agentsPricingFaq: FAQItem[] = [
  {
    id: "who-owns-the-data",
    question: "Who owns the data when an agent creates a link on my behalf?",
    answer:
      "You do. Every link an agent creates rolls up to your workspace, scoped to your userId and organizationId. The agent context (agent_id, agent_run_id, agent_actor_id, agent_tool_call_id) is metadata on top — useful for attribution, removable on archive, never a substitute for ownership. The agent is the actor; you are the owner. Cancel the agent's API key, the links stay yours.",
    category: "agents",
  },
  {
    id: "what-counts",
    question: "What counts as an agent-attributed event?",
    answer:
      "Any click that lands on a Go2 link with the agent attribution fields populated — either from the link's stored agent context, the click-time query keys (?ag, ?ar, ?at, ?au), or the x-agent-* headers. Plain clicks without agent context don't count toward the Scale meter; they bill against your normal tracked-clicks limit.",
    category: "agents",
  },
  {
    id: "self-host-cost",
    question: "Can I just self-host?",
    answer:
      "Yes. The whole stack is AGPL. A single wrangler deploy stands it up in your own Cloudflare account. If AGPL doesn't work for your company (it usually doesn't for closed-source SaaS), the commercial license is $5,000/year — flat fee, unlimited usage, perpetual.",
    category: "agents",
  },
  {
    id: "do-i-need-mcp",
    question: "Do I need MCP to use Go2?",
    answer:
      "No. The MCP server is the easiest path for Claude Code, Claude Desktop, Cursor, Windsurf, Codex. If you're integrating into Mastra, Vercel AI SDK, LangChain, or your own agent framework, the REST API is enough — agent fields are accepted on POST /api/v1/links and queryable via /api/v1/agent-attribution.",
    category: "agents",
  },
  {
    id: "vs-posthog",
    question: "How is this different from PostHog?",
    answer:
      "PostHog is product analytics. Go2 is the link layer that produces the click event. PostHog doesn't generate or own short URLs; we don't replace your funnel analytics. Most teams use both — Go2 records the click with full agent and channel context, PostHog rolls it into the conversion funnel via webhook.",
    category: "agents",
  },
  {
    id: "rate-limits",
    question: "What are the API rate limits?",
    answer:
      "Free: 100 req/min. Pro: 1K req/min. Business: 3K req/min. Scale: custom (default 10K req/min). All tiers get full access to the redirect path — rate limits only apply to the management API, not to user-facing redirects.",
    category: "agents",
  },
  {
    id: "downgrade",
    question: "Can I downgrade or cancel anytime?",
    answer:
      "Yes. Downgrade any time — your data stays on the lower-tier retention. Cancel any time — your account stays in read-only access for 30 days. We don't auto-delete; you have to opt in.",
    category: "agents",
  },
];

// Build a Product schema with one Offer per priced plan, plus FAQPage so
// AI assistants can quote individual Q&As verbatim. Pricing pulled from the
// canonical config so prices and the schema can never drift.
function buildPricingJsonLd(faqs: FAQItem[]) {
  const offers = pricingPlans
    .filter((p) => p.priceMonthly !== null)
    .map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(p.priceMonthly ?? 0),
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(p.priceMonthly ?? 0),
        priceCurrency: "USD",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
      url: `${siteConfig.url}/pricing`,
      availability: "https://schema.org/InStock",
      description: p.description,
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${siteConfig.url}/pricing#product`,
        name: `${siteConfig.name} — short links your AI agent can call`,
        description: siteConfig.description,
        brand: { "@type": "Brand", name: siteConfig.name },
        url: siteConfig.url,
        offers,
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/pricing#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };
}

export default function PricingPage() {
  const jsonLd = buildPricingJsonLd(agentsPricingFaq);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PricingSection
        headline="Free to ship. Pay when it works."
        subheadline="Start free with 100 links a month and 1 custom domain. Upgrade to Pro at $9/mo when you outgrow it, or Business at $49/mo for teams, SSO, and longer analytics retention. Self-host on your own Cloudflare account — AGPL — if you'd rather."
      />

      <FAQSection
        headline="Pricing FAQ"
        subheadline="The questions teams and developers ask before they pay."
        items={agentsPricingFaq}
      />

      <CTA
        headline="Track your first agent-attributed link this afternoon."
        description="One MCP install. Two API calls. No credit card required."
        primaryCTA={{ text: "Read the 5-min quickstart", href: "/agents/quickstart" }}
        secondaryCTA={{ text: "Talk to a human", href: "/contact" }}
      />
    </>
  );
}

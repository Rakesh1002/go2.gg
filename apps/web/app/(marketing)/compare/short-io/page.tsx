import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { CompareLayout } from "@/components/marketing/compare/compare-layout";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Short.io alternative for AI agents — Go2 vs Short.io",
    description:
      "Short.io competes on white-label custom domains for marketers. Go2 competes on agent-native primitives — MCP, per-run attribution, edge-first API, AGPL self-host.",
  }),
  alternates: { canonical: `${siteConfig.url}/compare/short-io` },
};

export default function ShortIoComparePage() {
  return (
    <CompareLayout
      slug="short-io"
      competitor={{
        name: "Short.io",
        url: "https://short.io",
        summary:
          "Short.io is a marketer-leaning shortener with a strong custom-domain story — branded short URLs, click analytics, deep links. They charge per click rather than per link, which is friendly for low-traffic teams. The product is solid; what it doesn't have is an MCP server, per-run agent attribution, or a way to self-host on your own infra.",
      }}
      hero={{
        headline: (
          <>
            Short.io vs Go2 — for{" "}
            <span className="text-gradient-warm">AI app</span> builders.
          </>
        ),
        sub: "Short.io is a great pick for marketing teams that need branded links. Go2 is built for engineers shipping AI agents — the click attribution, MCP server, and edge-first API are first-class, and the free tier ships the full developer surface.",
      }}
      pickThem={[
        "You need branded custom domains and your buyer is a marketer.",
        "You want a click-based pricing model rather than a link-based one.",
        "You're not building an AI agent and don't need MCP or attribution.",
        "You'd rather pay-per-click than pay-per-month at low volume.",
      ]}
      pickGo2={[
        "Your AI agent is the thing minting links, not a human marketer.",
        "You want per-run agent attribution out of the box.",
        "You want an MCP server + REST API + TypeScript SDK on Free.",
        "You'd like the option to AGPL self-host on your own Cloudflare account.",
      ]}
      verdict={
        <>
          If your buyer-question is{" "}
          <em>"can I brand my marketing links with my own domain?"</em> — Short.io
          is fine.
          <br />
          If your buyer-question is{" "}
          <em>"how do I attribute the clicks back to the AI run that minted them?"</em>{" "}
          — Short.io can't answer that. Go2 was built to.
        </>
      }
      categories={[
        {
          title: "Pricing",
          rows: [
            { feature: "Free tier links", go2: "100/mo", competitor: "Unlimited" },
            { feature: "Free tier clicks", go2: "5K/mo", competitor: "1K/mo" },
            { feature: "Cheapest paid plan", go2: "$9/mo", competitor: "$24/mo" },
            { feature: "Free custom domain", go2: "1", competitor: false, highlight: true },
            { feature: "API on Free", go2: true, competitor: false, highlight: true },
          ],
        },
        {
          title: "Agent attribution",
          rows: [
            { feature: "MCP server", go2: true, competitor: false, highlight: true },
            { feature: "Per-run agent attribution", go2: true, competitor: false, highlight: true },
            { feature: "agent_id, run_id, actor_id schema", go2: true, competitor: false },
            { feature: "Agent-runs dashboard", go2: true, competitor: false },
          ],
        },
        {
          title: "Edge runtime",
          rows: [
            { feature: "Cloudflare Workers redirect", go2: true, competitor: false, highlight: true },
            { feature: "p50 redirect latency", go2: "<10ms", competitor: "~30-50ms" },
            { feature: "AGPL self-host", go2: true, competitor: false, highlight: true },
          ],
        },
        {
          title: "Developer surface",
          rows: [
            { feature: "REST API", go2: true, competitor: true },
            { feature: "OpenAPI spec", go2: true, competitor: false },
            { feature: "TypeScript SDK", go2: true, competitor: "Community" },
            { feature: "Webhooks", go2: "Pro", competitor: "Pro" },
            { feature: "Audit logs", go2: "Business", competitor: "Enterprise" },
          ],
        },
      ]}
      faqs={[
        {
          q: "Is Go2 a Short.io alternative for AI agents?",
          a: "Yes. The categories are different jobs — Short.io is marketer-shaped (branded domains as the headline feature, click-based billing), Go2 is engineer-shaped (MCP server, REST API on Free, agent attribution as the headline feature). If you're shipping an AI agent that mints URLs, Go2 is purpose-built; Short.io can do the redirects but you'd build the attribution layer yourself.",
        },
        {
          q: "Can I bring my own custom domain on Go2's Free tier?",
          a: "Yes — every Free user gets one custom domain with automatic SSL via Cloudflare. Pro adds 5 domains, Business adds 25. Short.io's Free tier doesn't include a branded domain; you'd need their $24/mo Personal plan.",
        },
        {
          q: "Does Short.io support MCP?",
          a: "No. Short.io has a REST API but no MCP server. Go2 publishes @go2/mcp-server on npm and runs a remote Streamable-HTTP transport at mcp.go2.gg/mcp — install in Claude Code, Claude Desktop, Cursor, Windsurf, ChatGPT custom GPTs, or Perplexity in one paste.",
        },
        {
          q: "Is the click-based pricing on Short.io cheaper for low-traffic agents?",
          a: "Sometimes. If your agent generates 50 links/mo with 100 clicks each, Short.io's pay-per-click model can be slightly cheaper than Go2 Pro at $9/mo. Once you cross ~1K clicks/mo, Go2 is cheaper, and the developer surface (MCP, OpenAPI, agent attribution, AGPL) is the deciding factor anyway.",
        },
        {
          q: "Does Short.io give me the data I need to attribute clicks back to an AI run?",
          a: "No. Short.io's click events have a referrer + UA + geo, same as Bitly. There's no concept of agent_id, run_id, or actor_id — you'd need to encode all of that into the destination URL as query params and parse them out yourself, which only works for clicks that don't strip the params. Go2's attribution survives re-sharing because the agent context lives on the link itself.",
        },
        {
          q: "Can I self-host Go2 the way I would an OSS shortener?",
          a: "Yes — Go2 is AGPL-3.0 and the entire stack runs on your Cloudflare account: Workers + D1 + KV + R2. One wrangler deploy. Short.io is closed-source SaaS only.",
        },
      ]}
      otherCompares={[
        { slug: "dub-vs-go2-for-agents", label: "vs Dub.co" },
        { slug: "bitly", label: "vs Bitly" },
        { slug: "sink", label: "vs Sink (open source)" },
      ]}
    />
  );
}

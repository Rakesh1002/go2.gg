import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { CompareLayout } from "@/components/marketing/compare/compare-layout";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Sink alternative — Go2 vs Sink (Cloudflare-native URL shorteners)",
    description:
      "Both run on Cloudflare. Sink is the OSS DIY shortener you self-host. Go2 is the managed agent-native version with MCP, per-run attribution, and a generous free tier — also AGPL self-host if you want.",
  }),
  alternates: { canonical: `${siteConfig.url}/compare/sink` },
};

export default function SinkComparePage() {
  return (
    <CompareLayout
      slug="sink"
      competitor={{
        name: "Sink",
        url: "https://github.com/ccbikai/Sink",
        summary:
          "Sink is the popular OSS Cloudflare-native shortener — Nuxt + Workers + KV + Analytics Engine, single-tenant, deploy-it-yourself. Same edge stack as Go2, different product surface: Sink hands you a binary; Go2 hands you a managed platform with agent attribution + an MCP server + a free hosted tier.",
      }}
      hero={{
        headline: (
          <>
            Sink vs Go2 — same edge stack, different{" "}
            <span className="text-gradient-warm">product surface</span>.
          </>
        ),
        sub: "Sink is great if you want to ship a personal-use shortener in an afternoon. Go2 is what you want when your AI agent needs a managed platform — with attribution, MCP, lifecycle controls, and a hosted tier you can grow on.",
      }}
      pickThem={[
        "You want a single-tenant URL shortener for personal use.",
        "You enjoy maintaining your own deploy and don't need attribution.",
        "Your traffic is small enough that Cloudflare's free tier covers everything.",
        "You don't need an MCP server, webhooks, A/B tests, or a team-dashboard.",
      ]}
      pickGo2={[
        "Your AI agent needs the link toolkit as a managed service, not a side-project.",
        "You need per-run agent attribution out of the box.",
        "You want an MCP server, REST API, OpenAPI spec, and a TypeScript SDK on day one.",
        "You'd still like the option to AGPL self-host if your needs change.",
      ]}
      verdict={
        <>
          Sink is the great-weekend-project shortener.
          <br />
          Go2 is the managed-platform shortener that an AI app builds against.
          <br />
          Both run on Cloudflare. Same physics, different jobs.
        </>
      }
      categories={[
        {
          title: "Distribution",
          rows: [
            { feature: "Hosted tier", go2: "Free + paid", competitor: "DIY only", highlight: true },
            { feature: "Self-host", go2: "AGPL", competitor: "MIT" },
            { feature: "Multi-tenant", go2: true, competitor: false, highlight: true },
            { feature: "Team / org workspaces", go2: true, competitor: false },
          ],
        },
        {
          title: "Agent attribution",
          rows: [
            { feature: "MCP server", go2: true, competitor: false, highlight: true },
            { feature: "Per-run agent attribution", go2: true, competitor: false, highlight: true },
            { feature: "agent_id propagation to clicks", go2: true, competitor: false },
            { feature: "Agent-runs dashboard", go2: true, competitor: false },
          ],
        },
        {
          title: "Lifecycle controls",
          rows: [
            { feature: "Custom slugs", go2: true, competitor: true },
            { feature: "Link expiration", go2: "Workflows-backed", competitor: "Manual" },
            { feature: "Password protection", go2: true, competitor: false },
            { feature: "A/B testing", go2: "Business", competitor: false },
            { feature: "Geo / device targeting", go2: "Pro", competitor: false },
          ],
        },
        {
          title: "Developer surface",
          rows: [
            { feature: "REST API", go2: true, competitor: false, highlight: true },
            { feature: "OpenAPI spec", go2: true, competitor: false },
            { feature: "TypeScript SDK", go2: true, competitor: false },
            { feature: "Webhooks", go2: "Pro", competitor: false },
            { feature: "Audit logs", go2: "Business", competitor: false },
          ],
        },
        {
          title: "Pricing",
          rows: [
            { feature: "Free tier", go2: "100 links/mo, 5K clicks", competitor: "Self-hosted (CF Free)" },
            { feature: "Pro plan", go2: "$9/mo", competitor: "—" },
            { feature: "Business plan", go2: "$49/mo", competitor: "—" },
            { feature: "Scale (usage)", go2: "$0.40/1K events", competitor: "—" },
          ],
        },
      ]}
      faqs={[
        {
          q: "Is Sink a Go2 alternative?",
          a: "Sink is a great alternative if you want a personal-use shortener and you're comfortable maintaining a Workers deploy. It's not a great alternative if you want agent attribution, an MCP server, multi-tenant team workspaces, or any of the lifecycle features (A/B, geo targeting, password protection). Sink and Go2 sit at different points on the build-vs-buy curve.",
        },
        {
          q: "Both run on Cloudflare — what's the actual difference under the hood?",
          a: "Same building blocks: Workers for the redirect, KV for the hot path, D1 for the click ledger, Analytics Engine for aggregations. The differences are above that: Go2 has a 4-field agent attribution model (agent_id, run_id, actor_id, tool_call_id) propagated end-to-end, an MCP server with 16 tools, a multi-tenant org/team layer, webhook dispatch, durable Workflows for link expiry, an OAuth 2.1 server for remote MCP, and a billing system. Sink has the redirect + a dashboard.",
        },
        {
          q: "Can I self-host Go2 like I would Sink?",
          a: "Yes. Go2 is AGPL-3.0 and the whole stack runs on your Cloudflare account — single wrangler deploy for the API, single deploy for the Next.js dashboard. See SELF_HOSTING.md in the repo. You'd need to provision your own D1, KV, R2, queue, and Stripe (if you want billing); about 30 minutes of setup.",
        },
        {
          q: "Is Sink faster than Go2?",
          a: "No measurable difference for the redirect path — both serve from Cloudflare's edge with sub-10ms typical p50 latency from KV. The redirect is identical Workers + KV physics. Where the platforms diverge is everything you do with the click *after* redirect.",
        },
        {
          q: "Does Sink have an MCP server?",
          a: "No. Go2 publishes @go2/mcp-server on npm and runs a remote Streamable-HTTP transport at mcp.go2.gg/mcp that Claude.ai, ChatGPT, and Perplexity can install with one paste. Sink has a Nuxt dashboard, not an agent-callable surface.",
        },
        {
          q: "What if I started on Sink and outgrew it?",
          a: "Migrate the destinations into Go2's bulk-create endpoint at /api/v1/links/bulk — same JSON shape Sink uses for its CSV export. Slugs come over cleanly. Existing short URLs on your Sink domain won't redirect through Go2, but you keep your custom domain by transferring the CNAME pointer.",
        },
      ]}
      otherCompares={[
        { slug: "dub-vs-go2-for-agents", label: "vs Dub.co" },
        { slug: "bitly", label: "vs Bitly" },
        { slug: "short-io", label: "vs Short.io" },
      ]}
    />
  );
}

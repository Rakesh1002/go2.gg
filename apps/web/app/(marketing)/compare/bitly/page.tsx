import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { CompareLayout } from "@/components/marketing/compare/compare-layout";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Bitly alternative — Go2 vs Bitly",
    description:
      "Honest comparison: Bitly built the URL-shortener category for marketers. Go2 is built for teams managing links at scale and the AI agents that ship them — full API on Free, MCP server, free custom domains, AGPL self-host.",
  }),
  alternates: { canonical: `${siteConfig.url}/compare/bitly` },
};

export default function BitlyComparePage() {
  return (
    <CompareLayout
      slug="bitly"
      competitor={{
        name: "Bitly",
        url: "https://bitly.com",
        summary:
          "Bitly is the link-shortener that defined the category — sales-led, marketing-first, with a heavy enterprise focus. They charge for things developers expect to be free (API access, custom slugs, link-level analytics). Pricing reflects a marketer's expense account, not an indie builder's.",
      }}
      hero={{
        headline: (
          <>
            Bitly vs Go2 — for teams managing links and{" "}
            <span className="text-gradient-warm">the AI agents that ship them.</span>
          </>
        ),
        sub: "Bitly built the category for marketers. Go2 is built for the next one — branded links on your domain, full API on the free tier, edge-native redirects, and AI-agent attribution baked in. Here's the honest breakdown.",
      }}
      pickThem={[
        "You're a Fortune-500 marketing team with procurement-led purchasing.",
        "You need branded links + click tracking inside an existing enterprise stack.",
        "Your buyer is a CMO, not an engineer.",
        "You need 24/7 phone support and SOC 2 Type II already in place.",
      ]}
      pickGo2={[
        "You're shipping an AI agent that generates URLs.",
        "You need per-agent-run click attribution.",
        "You want to call the API on the free tier — no $29/mo upgrade required.",
        "You'd rather self-host on Cloudflare than depend on a SaaS roadmap.",
      ]}
      verdict={
        <>
          If your buyer-question is{" "}
          <em>"can the marketing team build a UTM-tracked branded link?"</em> —
          use Bitly.
          <br />
          If your buyer-question is{" "}
          <em>"how do I attribute clicks back to the AI run that minted them?"</em>{" "}
          — use Go2.
        </>
      }
      categories={[
        {
          title: "Pricing",
          rows: [
            { feature: "Free tier link cap", go2: "100/mo", competitor: "5/mo", highlight: true },
            { feature: "Free tier click tracking", go2: "5K/mo", competitor: "Unlimited (basic)" },
            { feature: "Cheapest paid plan", go2: "$9/mo (Pro)", competitor: "$8/mo (Core)" },
            { feature: "Custom domains on Free", go2: "1", competitor: false },
          ],
        },
        {
          title: "Developer experience",
          rows: [
            { feature: "REST API on Free", go2: true, competitor: false, highlight: true },
            { feature: "MCP server", go2: true, competitor: false, highlight: true },
            { feature: "TypeScript SDK", go2: true, competitor: "Community" },
            { feature: "OpenAPI spec", go2: true, competitor: true },
            { feature: "Self-host (open source)", go2: "AGPL", competitor: false, highlight: true },
            { feature: "Rate limit on Free", go2: "100 req/min", competitor: "1K req/hour" },
          ],
        },
        {
          title: "Agent attribution",
          rows: [
            { feature: "Per-run agent attribution", go2: true, competitor: false, highlight: true },
            { feature: "agent_id, run_id, actor_id propagation", go2: true, competitor: false, highlight: true },
            { feature: "Per-link agent metadata", go2: true, competitor: false },
            { feature: "Webhook on click", go2: "Pro", competitor: "Enterprise" },
          ],
        },
        {
          title: "Edge + performance",
          rows: [
            { feature: "Redirect runtime", go2: "Cloudflare Workers (<10ms)", competitor: "AWS (~50ms)" },
            { feature: "Custom slug latency", go2: "Edge-served from KV", competitor: "Origin lookup" },
            { feature: "Analytics retention (Free)", go2: "30 days", competitor: "30 days" },
          ],
        },
      ]}
      faqs={[
        {
          q: "Is Go2 a free Bitly alternative?",
          a: "Yes for indie builders. Go2's Free tier ships 100 tracked links/month and 5,000 attributed clicks/month with the full REST API and MCP server included. Bitly's Free tier is 5 links/month with no API access. If you want to call the API from code, Go2 Free is what you want; Bitly's equivalent is Core at $8/mo.",
        },
        {
          q: "Can I migrate my Bitly links to Go2?",
          a: "Yes — Bitly exports a CSV of your links, and Go2's import endpoint at /api/v1/links/bulk accepts that shape. Existing short URLs (bit.ly/abc) won't redirect through Go2 — you'd need to mint new go2.gg/abc links — but the destination URLs and slugs migrate cleanly.",
        },
        {
          q: "Does Bitly do agent attribution?",
          a: "No. Bitly tracks clicks but doesn't propagate agent identity — there's no concept of agent_id or run_id in their schema. Go2 stamps four agent fields on every link at create time and carries them onto every click event, so you can ask 'how did this Claude run perform?' and get an answer.",
        },
        {
          q: "Is Go2 open source?",
          a: "Yes. Go2 is licensed AGPL-3.0 and the entire stack runs on Cloudflare — Workers + D1 + KV. You can deploy your own copy in 10 minutes from a single wrangler deploy. Bitly is closed-source SaaS. A commercial license for closed-source distribution of Go2 is available at $5K/yr.",
        },
        {
          q: "What about Bitly's branded short domain feature?",
          a: "Go2 supports custom domains on every paid plan and even includes one on Free. Bitly charges $35/mo for branded domains on their Core tier and meters them above that — Go2 includes 5 on Pro at $9/mo and 25 on Business at $49/mo.",
        },
        {
          q: "Does Go2 have an MCP server I can install in Claude Code or Cursor?",
          a: "Yes. `npx @go2/mcp-server` lives in the npm registry and there's a remote Streamable-HTTP transport at mcp.go2.gg/mcp for hosted clients (Claude.ai web, ChatGPT custom GPTs, Perplexity). Bitly has no MCP integration.",
        },
        {
          q: "Where can I see real numbers?",
          a: "The /agents/playground page lets you mint a tracked link with no signup, share it, and watch clicks land in real time — no API key, no credit card, just a public sandbox. The dashboard preview is at /dashboard/agent-runs once you sign up.",
        },
      ]}
      otherCompares={[
        { slug: "dub-vs-go2-for-agents", label: "vs Dub.co" },
        { slug: "sink", label: "vs Sink (open source)" },
        { slug: "short-io", label: "vs Short.io" },
      ]}
    />
  );
}

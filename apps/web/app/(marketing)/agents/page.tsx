import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, siteConfig } from "@repo/config";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AgentHero } from "@/components/marketing/agents/agent-hero";
import { ToolkitPillars } from "@/components/marketing/agents/toolkit-pillars";
import { PainGain } from "@/components/marketing/agents/pain-gain";
import { AttributionFlow } from "@/components/marketing/agents/attribution-flow";
import { AttributionQuestions } from "@/components/marketing/agents/attribution-questions";
import { McpInstallSnippet } from "@/components/marketing/agents/mcp-install-snippet";
import { AgentUseCases } from "@/components/marketing/agents/agent-use-cases";
import { ComparisonVsDub } from "@/components/marketing/agents/comparison-vs-dub";
import { FAQSection } from "@/components/marketing/sections/faq-section";
import { CTA } from "@/components/marketing/sections/cta";
import type { FAQItem } from "@repo/config";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Branded short links your AI agent can ship — MCP, REST, attribution",
    description:
      "Same workspace, same domains, same analytics — whether you, your team, or your AI agent created the link. One MCP install, every agent client. Track each click back to the run that made it. Built on Cloudflare. Open source.",
  }),
  alternates: { canonical: `${siteConfig.url}/agents` },
};

const agentsFaq: FAQItem[] = [
  {
    id: "what-can-agent-do",
    question: "What exactly can my agent do with Go2?",
    answer:
      "Create branded short URLs (with custom slugs, OG previews, geo/device targeting, password gating), track every click with full analytics (geo, device, browser, OS, referrer), pull per-link or per-run summaries, attribute clicks back to (agent_id, run_id, actor_id, tool_call_id), control link lifecycle (revocable, single-use, expiring), and query usage. All 16 tools are exposed via MCP and REST.",
    category: "agents",
  },
  {
    id: "do-i-need-mcp",
    question: "Do I need to use MCP?",
    answer:
      "No. The MCP server is the easiest path for Claude Code, Claude Desktop, Cursor, Windsurf, Codex. If you're integrating into Mastra, Vercel AI SDK, LangChain, or your own agent framework, the REST API is enough — every endpoint accepts the same fields the MCP tools accept.",
    category: "agents",
  },
  {
    id: "what-is-attribution",
    question: "What is per-run attribution and why does it matter?",
    answer:
      "Optionally, every link can be stamped with four identifiers: agent_id (which agent), agent_run_id (which execution), agent_actor_id (which user the agent acted for), agent_tool_call_id (which MCP tool call produced the link). Those fields are persisted on the link and re-stamped on every click — so you can rewind from any click to the run, prompt, and tool call that generated the link. It's optional, but unique to Go2.",
    category: "agents",
  },
  {
    id: "mcp-replaced",
    question: "What if MCP gets replaced by another protocol?",
    answer:
      "The link toolkit and the data model survive any transport change. The MCP server is a thin wrapper over the REST API — if the protocol shifts, only the wrapper rewrites. The 14 capabilities stay the same.",
    category: "agents",
  },
  {
    id: "self-host",
    question: "Can I self-host?",
    answer:
      "Yes. The whole stack is AGPL-licensed and runs on Cloudflare Workers + D1 + KV. A single wrangler deploy stands it up in your own account. A commercial license is available at $5K/yr if AGPL is a problem.",
    category: "agents",
  },
  {
    id: "vs-bitly",
    question: "How is this different from Bitly or a generic shortener?",
    answer:
      "Generic shorteners weren't built for agents. They have no MCP server, no concept of which agent or run produced a link, no programmatic lifecycle controls (revocable / single-use / TTL), and they price at $300+/mo for analytics Go2 includes from $9. Go2 covers the same branded-link basics you'd expect from any modern shortener and adds the agent layer on top — same workspace for both.",
    category: "agents",
  },
];

export default function AgentsPage() {
  return (
    <>
      <AgentHero variant="agents-page" />
      <ToolkitPillars />
      <PainGain />
      <AttributionFlow />
      <AttributionQuestions />
      <McpInstallSnippet />
      <AgentUseCases />

      {/* Built on Cloudflare strip */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
            Built on Cloudflare
          </p>
          <p className="mx-auto max-w-3xl text-[var(--marketing-text)] text-lg leading-relaxed md:text-xl">
            Workers for sub-10ms redirects. D1 for the click ledger. KV for hot-path lookup.
            Workflows for revocable, expiring, and single-use links. Your agent's link doesn't
            bottleneck the user.
          </p>
        </div>
      </section>

      <ComparisonVsDub />

      {/* Pricing teaser */}
      <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl">
            Priced for the AI startup buyer.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-[var(--marketing-text-muted)] text-lg">
            Free for evaluation. $9 once you ship. $49 for funded teams. Usage-based when one of
            your runs goes viral.
          </p>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Free", price: "$0", note: "100 links · 5K clicks/mo" },
              { name: "Pro", price: "$9", note: "2K links · 100K clicks/mo" },
              { name: "Business", price: "$49", note: "20K links · 500K clicks/mo" },
              { name: "Scale", price: "Usage", note: "$0.40 / 1K events above 500K" },
            ].map((tier) => (
              <div
                key={tier.name}
                className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-5 text-left"
              >
                <p className="font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                  {tier.name}
                </p>
                <p className="mt-2 font-bold text-2xl text-[var(--marketing-text)]">{tier.price}</p>
                <p className="mt-2 text-[var(--marketing-text-muted)] text-xs leading-relaxed">
                  {tier.note}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/pricing">
              <Button variant="outline" className="rounded-full">
                See full pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection
        headline="Common questions"
        subheadline="The things AI app builders ask before they ship Go2."
        items={agentsFaq}
      />

      {/* FAQPage JSON-LD wraps the same Q&As above so AI assistants and
          Google AI Overviews can quote them verbatim with attribution. */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered JSON-LD
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${siteConfig.url}/agents#faq`,
            mainEntity: agentsFaq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        }}
      />

      <CTA
        headline="Wire Go2 into your agent this afternoon."
        description="One MCP install. Your agent gets the full link toolkit. First tracked link in under five minutes."
        primaryCTA={{ text: "Try it live", href: "/agents/playground" }}
        secondaryCTA={{ text: "Read the quickstart", href: "/agents/quickstart" }}
      />
    </>
  );
}

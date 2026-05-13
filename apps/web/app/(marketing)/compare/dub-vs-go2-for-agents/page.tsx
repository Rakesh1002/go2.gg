import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ComparisonVsDub } from "@/components/marketing/agents/comparison-vs-dub";
import { CTA } from "@/components/marketing/sections/cta";

export const metadata: Metadata = getMetadata({
  title: "Dub.co alternative — Go2 vs Dub",
  description:
    "Honest comparison: Dub.co is built for partner programs and affiliate attribution. Go2 is the open-source link platform with branded short URLs, custom domains, and a first-class MCP server for the AI agents on your team.",
});

export default function DubVsGo2Page() {
  return (
    <>
      <section className="relative bg-[var(--marketing-bg)] pt-24 pb-16 md:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-wider"
          >
            Comparison · Updated 2026
          </Badge>
          <h1 className="font-bold text-4xl text-[var(--marketing-text)] leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Dub.co vs Go2 —{" "}
            <span className="text-gradient-warm">an honest comparison.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[var(--marketing-text-muted)] text-lg leading-relaxed">
            We respect Dub. They're a great link platform built for partner programs and affiliate
            payouts. Go2 covers the same branded-shortener basics and adds an MCP server so the
            AI agents on your team can ship tracked links into your workspace too. Here's the
            honest breakdown.
          </p>
          <p className="mt-3 text-[var(--marketing-text-muted)] text-sm">
            Not running agents?{" "}
            <Link
              href="/blog/branded-short-link-landscape-2026"
              className="font-medium text-[var(--marketing-accent)] hover:underline"
            >
              See the full landscape →
            </Link>
          </p>
        </div>
      </section>

      <ComparisonVsDub />

      {/* The verdict */}
      <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8">
              <p className="mb-3 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                Pick Dub if
              </p>
              <ul className="space-y-3 text-[var(--marketing-text-muted)] leading-relaxed">
                <li>You run an affiliate or partner program.</li>
                <li>Your buyer is a partner-program manager.</li>
                <li>You need Stripe Connect payouts to creators.</li>
                <li>Branded marketing links are the product.</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg-elevated)] p-8 shadow-[var(--marketing-accent)]/10 shadow-lg">
              <p className="mb-3 font-bold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
                Pick Go2 if
              </p>
              <ul className="space-y-3 text-[var(--marketing-text)] leading-relaxed">
                <li>You're shipping an AI agent that generates URLs.</li>
                <li>You need per-agent-run click attribution.</li>
                <li>You want an MCP server, not a marketing dashboard.</li>
                <li>You'd rather not roll your own attribution table.</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/40 p-8 text-center">
            <p className="mx-auto max-w-2xl text-[var(--marketing-text)] text-base leading-relaxed md:text-lg">
              If your buyer-question is{" "}
              <em>"what attribution did Justin's tweet drive?"</em> — use Dub.
              <br />
              If your buyer-question is{" "}
              <em>"what did the Claude run my user just had do?"</em> — use Go2.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/agents/quickstart">
                <Button
                  size="lg"
                  className="rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
                >
                  Try Go2 — 5-min quickstart
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="https://dub.co" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="rounded-full">
                  Visit Dub.co
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-links to siblings */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="mb-4 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
            Other comparisons
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { slug: "bitly", label: "vs Bitly" },
              { slug: "sink", label: "vs Sink (open source)" },
              { slug: "short-io", label: "vs Short.io" },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-4 py-2 text-[var(--marketing-text)] text-sm transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
              >
                {c.label}
                <ArrowRight className="ml-2 inline h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTA
        headline="Stop choosing between affiliate and agent."
        description="They're different jobs. Use both if you need to. Most teams don't."
        primaryCTA={{ text: "Read the agent pitch", href: "/agents" }}
        secondaryCTA={{ text: "View the API", href: "/developers/api" }}
      />
    </>
  );
}

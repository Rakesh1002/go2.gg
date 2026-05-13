import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Clock, Zap, Brain, ArrowRight, Check } from "lucide-react";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "AI-Assisted Link Editor — Smart Suggestions",
  description:
    "AI-assisted helpers inside the dashboard: auto-generate link previews, suggest memorable slugs, and recommend posting times. For agent-facing primitives (MCP, A2A, per-run attribution), see /agents.",
});

const features = [
  {
    icon: Wand2,
    title: "AI Link Previews",
    description:
      "Automatically generate optimized titles, descriptions, and images for your links using AI.",
  },
  {
    icon: Sparkles,
    title: "Smart Slug Generation",
    description: "AI creates memorable, brand-appropriate slugs based on your destination URL.",
  },
  {
    icon: Clock,
    title: "Scheduling Recommendations",
    description:
      "Get AI-powered insights on the best times to share your links based on click patterns.",
  },
  {
    icon: Brain,
    title: "Content Analysis",
    description: "AI analyzes your destination pages to suggest optimal link metadata.",
  },
  {
    icon: Zap,
    title: "One-Click Optimization",
    description: "Generate complete link previews with a single click—no manual work required.",
  },
  {
    icon: Brain,
    title: "Auto-Tagging",
    description:
      "AI suggests tags and folder placement based on the destination, so the dashboard stays organized as your link count grows.",
  },
];

const useCases = [
  {
    title: "Content Creators",
    description: "Generate professional link previews instantly without manual work.",
  },
  {
    title: "Marketers",
    description: "Optimize link metadata for better social media engagement.",
  },
  {
    title: "Solo operators",
    description:
      "Skip metadata busywork. The dashboard fills in the obvious choices so you can ship the link.",
  },
  {
    title: "Teams",
    description: "Save time with AI-generated previews and smart scheduling insights.",
  },
];

const benefits = [
  "Generate link previews in seconds",
  "Create memorable, brand-appropriate slugs",
  "Optimize posting times for maximum engagement",
  "Reduce manual metadata entry",
  "Improve social media link appearance",
  "Stay readable as your link library grows",
];

const faqs = [
  {
    question: "How does AI link preview generation work?",
    answer:
      "Our AI analyzes your destination URL, fetches the page content, and uses advanced language models to generate optimized titles, descriptions, and suggest images. The AI understands context and creates previews that improve click-through rates.",
  },
  {
    question: "Wait — is this the same as your MCP server / agent platform?",
    answer:
      "No. This page is about AI-assisted helpers a human uses inside the Go2 dashboard — auto-generated previews, slug suggestions, posting-time recommendations. The agent platform is a different product on the same account: an MCP server, A2A card, OAuth 2.1, and per-run attribution that lets your AI agent create and track its own links. See /agents for that.",
  },
  {
    question: "How accurate are scheduling recommendations?",
    answer:
      "Our AI analyzes your historical click data to identify patterns in when your audience is most active. Recommendations consider timezone, day of week, and hour patterns to suggest optimal posting times.",
  },
  {
    question: "Can I use these helpers via the API?",
    answer:
      "Yes. The smart-helper endpoints (POST /api/v1/ai/preview, GET /api/v1/ai/scheduling, GET /api/v1/ai/suggestions) are part of the same REST API the dashboard uses. They're suggestions, though — they don't create or modify links on their own.",
  },
];

export default function AIFeaturePage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Decorative background */}
      <div className="-top-24 -right-24 absolute h-96 w-96 rounded-full bg-[var(--marketing-accent)]/5 blur-[120px]" />

      {/* Hero */}
      <section className="relative max-w-7xl px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Sparkles className="h-4 w-4" />
            AI-assisted dashboard
          </div>
          <h1 className="font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-6xl md:text-7xl">
            Smart helpers
            <span className="mt-2 block text-[var(--marketing-accent)] italic">inside the editor</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            AI-assisted helpers for the human in the dashboard: auto-generate previews, suggest
            memorable slugs, recommend the best time to post. The boring parts of link management,
            done for you.
          </p>
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/60 p-4 text-left text-sm">
            <p className="text-[var(--marketing-text-muted)]">
              <span className="font-semibold text-[var(--marketing-text)]">Looking for the agent platform?</span>{" "}
              This page is about AI helpers a human uses inside the dashboard. If you want your AI
              agent to create and track links — MCP server, A2A card, per-run attribution — head to{" "}
              <Link
                href="/agents"
                className="font-semibold text-[var(--marketing-accent)] underline underline-offset-2 hover:text-[var(--marketing-accent-light)]"
              >
                /agents
              </Link>
              .
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full bg-[var(--marketing-accent)] px-8 font-bold text-white shadow-[var(--marketing-accent)]/20 shadow-lg hover:bg-[var(--marketing-accent-light)]"
              >
                Try the helpers free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/agents">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-[var(--marketing-border)] bg-transparent px-8 font-bold text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
              >
                I'm an agent builder →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Demo */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--marketing-text-muted)] text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Preview Generation</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-[var(--marketing-text-muted)] text-xs">
                      Input URL:
                    </div>
                    <div className="rounded bg-[var(--marketing-bg-elevated)] p-2 font-mono text-[var(--marketing-text)] text-sm">
                      https://example.com/product
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-[var(--marketing-accent)]" />
                  </div>
                  <div>
                    <div className="mb-1 text-[var(--marketing-text-muted)] text-xs">
                      AI Generated:
                    </div>
                    <div className="space-y-2 rounded border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-3">
                      <div className="font-semibold text-[var(--marketing-text)]">
                        Amazing Product - Check It Out!
                      </div>
                      <div className="text-[var(--marketing-text-muted)] text-sm">
                        Discover our revolutionary product that changes everything...
                      </div>
                      <div className="text-[var(--marketing-text-muted)] text-xs">
                        ✓ Title optimized ✓ Description generated ✓ Image suggested
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl bg-[var(--marketing-bg)] px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-bold text-2xl text-[var(--marketing-text)] md:text-4xl">
            The boring parts, done for you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--marketing-text-muted)]">
            Six AI-assisted helpers inside the dashboard. None of these run on your behalf — they
            just suggest. The human is still the one clicking save.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--marketing-text)] text-lg">
                {feature.title}
              </h3>
              <p className="mt-2 text-[var(--marketing-text-muted)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="font-bold text-2xl text-[var(--marketing-text)] md:text-4xl">
              Perfect for Every Team
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
              >
                <h3 className="font-semibold text-[var(--marketing-text)]">{useCase.title}</h3>
                <p className="mt-2 text-[var(--marketing-text-muted)] text-sm">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl bg-[var(--marketing-bg)] px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-bold text-2xl text-[var(--marketing-text)] md:text-4xl">
              Why have helpers in the editor at all?
            </h2>
            <p className="mt-4 text-[var(--marketing-text-muted)]">
              Because most link-creation work is metadata busywork. Smart suggestions get you to a
              good link in one click — without taking the call away from you.
            </p>
            <ul className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-[var(--marketing-text)]">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium text-[var(--marketing-text)] text-sm">
                <Brain className="h-4 w-4 text-[var(--marketing-accent)]" />
                <span>AI Scheduling Insight</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-[var(--marketing-bg-elevated)] p-4">
                  <div className="mb-2 text-[var(--marketing-text-muted)] text-sm">
                    Best posting time:
                  </div>
                  <div className="font-semibold text-[var(--marketing-text)] text-lg">
                    Tuesday, 2:00 PM EST
                  </div>
                  <div className="mt-1 text-[var(--marketing-text-muted)] text-xs">
                    Based on 1,234 clicks analyzed
                  </div>
                </div>
                <div className="text-[var(--marketing-text-muted)] text-xs">
                  Your audience is most active on Tuesdays between 1-3 PM EST. Posts during this
                  window see 34% higher engagement.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center font-bold text-2xl text-[var(--marketing-text)]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
                >
                  <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">
                    {faq.question}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
}

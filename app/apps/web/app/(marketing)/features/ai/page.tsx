import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Clock, Zap, Brain, ArrowRight, Check } from "lucide-react";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "AI-Powered Features - Smart Link Management",
  description:
    "Use AI to generate link previews, optimize slugs, and get scheduling recommendations. Make link management effortless with AI.",
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
    icon: Sparkles,
    title: "MCP Integration",
    description: "Manage links through AI assistants like Claude using our MCP server.",
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
    title: "Developers",
    description: "Integrate AI features via API or MCP server for automated workflows.",
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
  "Integrate with AI assistants via MCP",
];

const faqs = [
  {
    question: "How does AI link preview generation work?",
    answer:
      "Our AI analyzes your destination URL, fetches the page content, and uses advanced language models to generate optimized titles, descriptions, and suggest images. The AI understands context and creates previews that improve click-through rates.",
  },
  {
    question: "What is the MCP server?",
    answer:
      "MCP (Model Context Protocol) allows AI assistants like Claude Desktop to manage your links through natural language. Install our MCP server and ask Claude to create links, check analytics, or update destinations—all conversationally.",
  },
  {
    question: "How accurate are scheduling recommendations?",
    answer:
      "Our AI analyzes your historical click data to identify patterns in when your audience is most active. Recommendations consider timezone, day of week, and hour patterns to suggest optimal posting times.",
  },
  {
    question: "Can I use AI features via the API?",
    answer:
      "Yes! All AI features are available through our REST API. Generate previews, create smart slugs, and get scheduling recommendations programmatically.",
  },
];

export default function AIFeaturePage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Decorative background */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--marketing-accent)]/5 blur-[120px]" />

      {/* Hero */}
      <section className="max-w-7xl relative px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8">
            <Sparkles className="h-4 w-4" />
            Artificial Intelligence
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-6xl md:text-7xl">
            Smart Link Management
            <span className="block mt-2 text-[var(--marketing-accent)] italic">Powered by AI</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed">
            Let intelligence handle the heavy lifting. Generate previews, optimize slugs, and get
            scheduling insights automatically.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full font-bold shadow-lg shadow-[var(--marketing-accent)]/20 gap-2 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
              >
                Try AI Features Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/integrations/mcp">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-full font-bold border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                Learn About MCP
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Demo */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[var(--marketing-text-muted)]">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Preview Generation</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[var(--marketing-text-muted)] mb-1">
                      Input URL:
                    </div>
                    <div className="font-mono text-sm p-2 rounded bg-[var(--marketing-bg-elevated)] text-[var(--marketing-text)]">
                      https://example.com/product
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-[var(--marketing-accent)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--marketing-text-muted)] mb-1">
                      AI Generated:
                    </div>
                    <div className="space-y-2 p-3 rounded border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50">
                      <div className="font-semibold text-[var(--marketing-text)]">
                        Amazing Product - Check It Out!
                      </div>
                      <div className="text-sm text-[var(--marketing-text-muted)]">
                        Discover our revolutionary product that changes everything...
                      </div>
                      <div className="text-xs text-[var(--marketing-text-muted)]">
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
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
            AI Features That Save Time
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] max-w-2xl mx-auto">
            Automate link management tasks with intelligent AI features.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-[var(--marketing-text)]">
                {feature.title}
              </h3>
              <p className="text-[var(--marketing-text-muted)] mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
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
                <p className="text-sm text-[var(--marketing-text-muted)] mt-2">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
              Why Use AI for Link Management?
            </h2>
            <p className="mt-4 text-[var(--marketing-text-muted)]">
              AI-powered features automate repetitive tasks and help you create better-performing
              links with less effort.
            </p>
            <ul className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-[var(--marketing-text)]">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--marketing-text)]">
                <Brain className="h-4 w-4 text-[var(--marketing-accent)]" />
                <span>AI Scheduling Insight</span>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[var(--marketing-bg-elevated)]">
                  <div className="text-sm text-[var(--marketing-text-muted)] mb-2">
                    Best posting time:
                  </div>
                  <div className="text-lg font-semibold text-[var(--marketing-text)]">
                    Tuesday, 2:00 PM EST
                  </div>
                  <div className="text-xs text-[var(--marketing-text-muted)] mt-1">
                    Based on 1,234 clicks analyzed
                  </div>
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)]">
                  Your audience is most active on Tuesdays between 1-3 PM EST. Posts during this
                  window see 34% higher engagement.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-12 text-[var(--marketing-text)]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
                >
                  <h3 className="font-semibold text-lg mb-2 text-[var(--marketing-text)]">
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

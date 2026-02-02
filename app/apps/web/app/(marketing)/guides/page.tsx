import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { BookOpen, Rocket, Code2, BarChart3, Zap, ArrowRight, FileText } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = getMetadata({
  title: "Guides & Tutorials",
  description:
    "Learn how to get the most out of Go2 with step-by-step guides, tutorials, and best practices.",
});

const guideCategories = [
  {
    title: "Getting Started",
    description: "New to Go2? Start here.",
    icon: Rocket,
    guides: [
      { title: "Quick Start Guide", href: "/docs/quickstart", time: "5 min" },
      { title: "Create Your First Link", href: "/docs/features/links", time: "3 min" },
      { title: "Understanding Analytics", href: "/docs/features/analytics", time: "5 min" },
      { title: "Add a Custom Domain", href: "/docs/features/domains", time: "10 min" },
    ],
  },
  {
    title: "API & Development",
    description: "Build with the Go2 API.",
    icon: Code2,
    guides: [
      { title: "API Overview", href: "/docs/api/overview", time: "10 min" },
      { title: "Authentication Guide", href: "/docs/api/authentication", time: "5 min" },
      { title: "Links API Reference", href: "/docs/api/links", time: "15 min" },
      { title: "Webhooks Setup", href: "/docs/api/webhooks", time: "10 min" },
    ],
  },
  {
    title: "Integrations",
    description: "Connect Go2 to your tools.",
    icon: Zap,
    guides: [
      { title: "Zapier Integration", href: "/docs/integrations/zapier", time: "5 min" },
      { title: "Make.com Setup", href: "/docs/integrations/make", time: "5 min" },
      { title: "Slack Notifications", href: "/docs/integrations/slack", time: "5 min" },
      { title: "MCP Server for Claude", href: "/docs/integrations/mcp", time: "10 min" },
    ],
  },
  {
    title: "Marketing Best Practices",
    description: "Maximize your impact.",
    icon: BarChart3,
    guides: [
      { title: "UTM Tracking Guide", href: "/docs/guides/utm-tracking", time: "8 min" },
      { title: "QR Code Best Practices", href: "/docs/api/qr-codes", time: "5 min" },
      { title: "Link-in-Bio Optimization", href: "/features/link-in-bio", time: "5 min" },
      { title: "Conversion Tracking Setup", href: "/features/conversions", time: "10 min" },
    ],
  },
];

const featuredGuides = [
  {
    title: "The Complete Guide to Link Shortening",
    description:
      "Everything you need to know about URL shorteners, best practices, and how to measure success.",
    href: "/docs",
    type: "guide",
    icon: BookOpen,
  },
  {
    title: "Migrating from Bitly",
    description: "Step-by-step guide to importing your links and analytics from Bitly to Go2.",
    href: "/features/migration",
    type: "tutorial",
    icon: FileText,
  },
  {
    title: "Building a Link Shortener with the API",
    description: "Create your own custom link shortening experience using the Go2 API.",
    href: "/docs/api/overview",
    type: "tutorial",
    icon: Code2,
  },
];

export default function GuidesPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <BookOpen className="h-4 w-4" />
            Learn Go2
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Guides &{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">Tutorials</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Learn how to get the most out of Go2 with step-by-step guides, tutorials, and best
            practices.
          </p>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-8">Featured Guides</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-accent)]/30 hover:-translate-y-1 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mb-4 group-hover:bg-[var(--marketing-accent)] group-hover:text-white transition-colors">
                  <guide.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-[var(--marketing-accent)] uppercase tracking-wider">
                  {guide.type}
                </span>
                <h3 className="text-lg font-bold text-[var(--marketing-text)] mt-2 mb-2 group-hover:text-[var(--marketing-accent)] transition-colors">
                  {guide.title}
                </h3>
                <p className="text-sm text-[var(--marketing-text-muted)]">{guide.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Categories */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-12">
            {guideCategories.map((category) => (
              <div key={category.title}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--marketing-text)]">
                      {category.title}
                    </h2>
                    <p className="text-sm text-[var(--marketing-text-muted)]">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {category.guides.map((guide) => (
                    <Link
                      key={guide.title}
                      href={guide.href}
                      className="group flex items-center justify-between p-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-accent)]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-accent)] transition-colors" />
                        <span className="font-medium text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors">
                          {guide.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--marketing-text-muted)]">
                          {guide.time}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-accent)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-4">
              Can't find what you need?
            </h2>
            <p className="text-[var(--marketing-text-muted)] mb-6">
              Our documentation has everything you need. Or reach out to our support team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/docs">
                <Button className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                  Browse Documentation
                </Button>
              </Link>
              <Link href="/help">
                <Button
                  variant="outline"
                  className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
                >
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Globe, BarChart3 } from "lucide-react";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "Case Studies - See How Teams Use Go2",
  description:
    "Real stories from teams using Go2 to shorten links, track campaigns, and grow their business.",
});

// Placeholder case studies - replace with real data
const caseStudies = [
  {
    id: "ecommerce-brand",
    company: "E-commerce Brand",
    industry: "Retail",
    logo: "🛍️",
    challenge: "Needed to track campaign performance across multiple channels",
    solution: "Used Go2's analytics and UTM tracking to measure ROI",
    results: [
      "34% increase in click-through rates",
      "Real-time campaign performance tracking",
      "Saved 10+ hours per week on manual reporting",
    ],
    quote: "Go2's analytics helped us identify which campaigns actually drive sales.",
    author: "Marketing Director",
  },
  {
    id: "saas-startup",
    company: "SaaS Startup",
    industry: "Technology",
    logo: "💻",
    challenge: "Wanted branded links for professional appearance",
    solution: "Connected custom domain and created branded short links",
    results: [
      "39% higher click-through rate vs generic shorteners",
      "Professional brand presence in all communications",
      "Easy link management for team",
    ],
    quote: "Branded links make us look more professional and trustworthy.",
    author: "Founder & CEO",
  },
  {
    id: "content-creator",
    company: "Content Creator",
    industry: "Media",
    logo: "🎬",
    challenge: "Needed link-in-bio page and click tracking",
    solution: "Created beautiful bio page with Go2's link gallery feature",
    results: [
      "5x increase in link clicks",
      "Beautiful, customizable bio page",
      "Insights into audience preferences",
    ],
    quote: "My bio page looks amazing and I finally know which links my audience loves.",
    author: "Content Creator",
  },
  {
    id: "marketing-agency",
    company: "Marketing Agency",
    industry: "Marketing",
    logo: "📊",
    challenge: "Managing links for multiple clients efficiently",
    solution: "Used Go2 API and webhooks for automated workflows",
    results: [
      "Automated link creation for all clients",
      "Real-time reporting via webhooks",
      "50% reduction in manual work",
    ],
    quote: "Go2's API integration saves us hours every day.",
    author: "Agency Owner",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="max-w-7xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-2 text-sm font-medium text-[var(--marketing-accent)] mb-6">
            <BarChart3 className="h-4 w-4" />
            Success Stories
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl text-[var(--marketing-text)]">
            See How Teams Use
            <span className="text-gradient block mt-2">Go2 to Grow</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--marketing-text-muted)]">
            Real stories from companies using Go2 to shorten links, track campaigns, and drive
            better results.
          </p>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="max-w-7xl px-4 py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2">
          {caseStudies.map((study) => (
            <div
              key={study.id}
              className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 hover:border-[var(--marketing-accent)]/30 transition-colors"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">{study.logo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[var(--marketing-text)]">
                      {study.company}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--marketing-bg-elevated)] text-[var(--marketing-text-muted)]">
                      {study.industry}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-[var(--marketing-text-muted)] mb-1">
                    Challenge
                  </h4>
                  <p className="text-sm text-[var(--marketing-text)]">{study.challenge}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-[var(--marketing-text-muted)] mb-1">
                    Solution
                  </h4>
                  <p className="text-sm text-[var(--marketing-text)]">{study.solution}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-[var(--marketing-text-muted)] mb-2">
                    Results
                  </h4>
                  <ul className="space-y-1">
                    {study.results.map((result, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-[var(--marketing-text)]">{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[var(--marketing-border)]">
                  <blockquote className="text-sm italic text-[var(--marketing-text-muted)] mb-2">
                    "{study.quote}"
                  </blockquote>
                  <p className="text-xs text-[var(--marketing-text-muted)]">— {study.author}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold md:text-4xl mb-4 text-[var(--marketing-text)]">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-[var(--marketing-text-muted)] max-w-2xl mx-auto">
              Join thousands of companies using Go2 to power their link management.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">1.5M+</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">Links Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">50K+</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">3B+</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">Clicks Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">99.99%</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold md:text-4xl mb-4 text-[var(--marketing-text)]">
            Ready to Join Them?
          </h2>
          <p className="text-[var(--marketing-text-muted)] mb-8">
            Start using Go2 today and see why teams choose us for their link management.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                Share Your Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
}

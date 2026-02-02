import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Check, X, ArrowRight, Crown } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { Button } from "@/components/ui/button";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "Go2 vs Competitors - Compare URL Shorteners",
  description:
    "See how Go2 compares to Bitly, Rebrandly, Short.io, and TinyURL. Feature comparison, pricing, and performance benchmarks.",
});

const competitors = ["Go2", "Bitly", "Rebrandly", "Short.io", "TinyURL"];

const featureComparison = [
  {
    category: "Performance",
    features: [
      { name: "Redirect Speed", values: ["<10ms", "~120ms", "~100ms", "~150ms", "~180ms"] },
      { name: "Edge Network", values: [true, false, false, true, false] },
      { name: "Zero Cold Starts", values: [true, false, false, false, false] },
      { name: "Global CDN", values: [true, true, true, true, false] },
    ],
  },
  {
    category: "Features",
    features: [
      { name: "Custom Domains", values: [true, true, true, true, false] },
      { name: "Link Analytics", values: [true, true, true, true, true] },
      { name: "QR Codes", values: [true, true, true, true, false] },
      { name: "Link-in-Bio", values: [true, false, false, false, false] },
      { name: "Geo Targeting", values: [true, true, true, true, false] },
      { name: "Device Targeting", values: [true, true, true, true, false] },
      { name: "Retargeting Pixels", values: [true, true, true, true, false] },
      { name: "API Access", values: [true, true, true, true, false] },
      { name: "Webhooks", values: [true, true, true, true, false] },
      { name: "AI Features", values: [true, false, false, false, false] },
    ],
  },
  {
    category: "Pricing",
    features: [
      {
        name: "Free Tier",
        values: ["50 links", "10 links", "5 links", "1,000 links", "Unlimited"],
      },
      { name: "Unlimited Links", values: ["From $9/mo", "$35/mo", "$29/mo", "$19/mo", "Free"] },
      {
        name: "Custom Domains",
        values: ["All plans", "Paid only", "Paid only", "All plans", "N/A"],
      },
      { name: "Unlimited Team", values: [true, false, false, false, false] },
    ],
  },
];

const speedBenchmarks = [
  { name: "Go2", speed: 8, label: "<10ms" },
  { name: "Rebrandly", speed: 100, label: "~100ms" },
  { name: "Bitly", speed: 120, label: "~120ms" },
  { name: "Short.io", speed: 150, label: "~150ms" },
  { name: "TinyURL", speed: 180, label: "~180ms" },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-red-400" />
    );
  }
  return <span className="text-sm text-[var(--marketing-text)]">{value}</span>;
}

export default function CompetitorsPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Crown className="h-4 w-4" />
            Comparison
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Go2 vs{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">The Rest</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            See how Go2 stacks up against Bitly, Rebrandly, Short.io, and TinyURL. Spoiler: we're
            faster.
          </p>
        </div>
      </section>

      {/* Speed Benchmark */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] text-center mb-8">
            Redirect Speed
          </h2>

          <div className="p-8 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
            <div className="space-y-6">
              {speedBenchmarks.map((item, idx) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span
                      className={`font-semibold ${idx === 0 ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"}`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`font-mono ${idx === 0 ? "text-[var(--marketing-accent)] font-bold" : "text-[var(--marketing-text-muted)]"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-[var(--marketing-bg)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${idx === 0 ? "bg-[var(--marketing-accent)]" : "bg-[var(--marketing-text-muted)]/30"}`}
                      style={{ width: `${Math.min((item.speed / 200) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-[var(--marketing-text-muted)] mt-6">
              Based on third-party benchmarks measuring p50 redirect latency from 50 global
              locations
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] text-center mb-8">
              Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--marketing-border)]">
                    <th className="text-left py-4 px-4 font-semibold text-[var(--marketing-text)]">
                      Feature
                    </th>
                    {competitors.map((competitor, idx) => (
                      <th
                        key={competitor}
                        className={`text-center py-4 px-4 font-semibold ${idx === 0 ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"}`}
                      >
                        {competitor}
                        {idx === 0 && <Crown className="h-4 w-4 inline ml-1" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((category) => (
                    <>
                      <tr key={category.category} className="bg-[var(--marketing-bg-elevated)]">
                        <td
                          colSpan={6}
                          className="py-3 px-4 font-bold text-[var(--marketing-text-muted)] uppercase text-xs tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr
                          key={feature.name}
                          className="border-b border-[var(--marketing-border)]"
                        >
                          <td className="py-4 px-4 text-sm text-[var(--marketing-text)]">
                            {feature.name}
                          </td>
                          {feature.values.map((value, idx) => (
                            <td
                              key={idx}
                              className={`text-center py-4 px-4 ${idx === 0 ? "bg-[var(--marketing-accent)]/5" : ""}`}
                            >
                              <div className="flex justify-center">
                                <FeatureValue value={value} />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Go2 */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--marketing-text)] mb-6">
            Why Teams Choose Go2
          </h2>

          <div className="grid gap-6 md:grid-cols-3 mt-12">
            <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
              <div className="text-4xl font-bold text-[var(--marketing-accent)] mb-2">10x</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">
                Faster redirects than competitors
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
              <div className="text-4xl font-bold text-[var(--marketing-accent)] mb-2">50%</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">
                Lower cost than Bitly Pro
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
              <div className="text-4xl font-bold text-[var(--marketing-accent)] mb-2">∞</div>
              <div className="text-sm text-[var(--marketing-text-muted)]">
                Unlimited team members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Migration CTA */}
      <section className="border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-4">
              Ready to Switch?
            </h2>
            <p className="text-[var(--marketing-text-muted)] mb-6">
              Import all your links from Bitly, Rebrandly, or Short.io with one click. No downtime,
              no data loss.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/features/migration">
                <Button className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                  Learn About Migration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
                >
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
}

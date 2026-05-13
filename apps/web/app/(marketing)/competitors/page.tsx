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
        values: ["100 links/mo", "10 links/mo", "5 links/mo", "1,000 links/mo", "Unlimited"],
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
  return <span className="text-[var(--marketing-text)] text-sm">{value}</span>;
}

export default function CompetitorsPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Crown className="h-4 w-4" />
            Comparison
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Go2 vs{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">The Rest</span>
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            See how Go2 stacks up against Bitly, Rebrandly, Short.io, and TinyURL. Spoiler: we're
            faster.
          </p>
        </div>
      </section>

      {/* Speed Benchmark */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)]">
            Redirect Speed
          </h2>

          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8">
            <div className="space-y-6">
              {speedBenchmarks.map((item, idx) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-semibold ${idx === 0 ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"}`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`font-mono ${idx === 0 ? "font-bold text-[var(--marketing-accent)]" : "text-[var(--marketing-text-muted)]"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-[var(--marketing-bg)]">
                    <div
                      className={`h-full rounded-full transition-all ${idx === 0 ? "bg-[var(--marketing-accent)]" : "bg-[var(--marketing-text-muted)]/30"}`}
                      style={{ width: `${Math.min((item.speed / 200) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[var(--marketing-text-muted)] text-xs">
              Based on third-party benchmarks measuring p50 redirect latency from 50 global
              locations
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)]">
              Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-[var(--marketing-border)] border-b">
                    <th className="px-4 py-4 text-left font-semibold text-[var(--marketing-text)]">
                      Feature
                    </th>
                    {competitors.map((competitor, idx) => (
                      <th
                        key={competitor}
                        className={`px-4 py-4 text-center font-semibold ${idx === 0 ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"}`}
                      >
                        {competitor}
                        {idx === 0 && <Crown className="ml-1 inline h-4 w-4" />}
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
                          className="px-4 py-3 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr
                          key={feature.name}
                          className="border-[var(--marketing-border)] border-b"
                        >
                          <td className="px-4 py-4 text-[var(--marketing-text)] text-sm">
                            {feature.name}
                          </td>
                          {feature.values.map((value, idx) => (
                            <td
                              key={idx}
                              className={`px-4 py-4 text-center ${idx === 0 ? "bg-[var(--marketing-accent)]/5" : ""}`}
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
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 font-bold text-3xl text-[var(--marketing-text)]">
            Why Teams Choose Go2
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
              <div className="mb-2 font-bold text-4xl text-[var(--marketing-accent)]">10x</div>
              <div className="text-[var(--marketing-text-muted)] text-sm">
                Faster redirects than competitors
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
              <div className="mb-2 font-bold text-4xl text-[var(--marketing-accent)]">50%</div>
              <div className="text-[var(--marketing-text-muted)] text-sm">
                Lower cost than Bitly Pro
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
              <div className="mb-2 font-bold text-4xl text-[var(--marketing-accent)]">∞</div>
              <div className="text-[var(--marketing-text-muted)] text-sm">
                Unlimited team members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Migration CTA */}
      <section className="border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-bold text-2xl text-[var(--marketing-text)]">
              Ready to Switch?
            </h2>
            <p className="mb-6 text-[var(--marketing-text-muted)]">
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
                  className="border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
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

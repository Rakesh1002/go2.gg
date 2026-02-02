"use client";

import { motion } from "framer-motion";
import { Check, X, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const competitors = [
  { name: "Bitly", logo: "B" },
  { name: "Rebrandly", logo: "R" },
  { name: "Short.io", logo: "S" },
  { name: "TinyURL", logo: "T" },
];

const features = [
  { name: "Sub-10ms Redirects", go2: true, others: false, highlight: true },
  { name: "275+ Edge Locations", go2: true, others: false, highlight: true },
  { name: "Custom Domains", go2: true, others: true },
  { name: "Analytics Dashboard", go2: true, others: true },
  { name: "QR Code Generation", go2: true, others: true },
  { name: "Retargeting Pixels", go2: true, others: "partial" },
  { name: "API Access", go2: true, others: true },
  { name: "Team Collaboration", go2: true, others: "partial" },
  { name: "Link-in-Bio Pages", go2: true, others: "partial" },
  { name: "Conversion Tracking", go2: true, others: "partial" },
  { name: "Free Forever Plan", go2: true, others: false, highlight: true },
  { name: "No Link Branding", go2: true, others: false },
];

export function CompetitorComparison() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-[var(--marketing-bg)]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--marketing-bg-elevated)]/50 to-[var(--marketing-bg)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      <div className="max-w-7xl relative px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-medium text-[var(--marketing-accent)]">
            <Zap className="h-4 w-4" />
            Why Switch to Go2
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] md:text-4xl lg:text-5xl">
            Built different. <span className="text-gradient">Built faster.</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">
            See how Go2 stacks up against the competition. Spoiler: we're faster, more affordable,
            and more feature-rich.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-xl">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 border-b border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-4 md:grid-cols-6">
              <div className="col-span-2 flex items-center text-sm font-medium text-[var(--marketing-text-muted)]">
                Features
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] text-white shadow-lg shadow-[var(--marketing-accent)]/25">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-sm font-bold text-[var(--marketing-text)]">Go2</span>
              </div>
              <div className="hidden items-center justify-center md:flex">
                <span className="text-sm text-[var(--marketing-text-muted)]">Others</span>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--marketing-border)]">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-3 gap-4 p-4 transition-colors hover:bg-[var(--marketing-bg-elevated)]/30 md:grid-cols-6 ${
                    feature.highlight ? "bg-[var(--marketing-accent)]/5" : ""
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--marketing-text)]">
                      {feature.name}
                    </span>
                    {feature.highlight && (
                      <span className="rounded-full bg-[var(--marketing-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--marketing-accent)]">
                        Exclusive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                      <Check className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <div className="hidden items-center justify-center md:flex">
                    {feature.others === true ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                        <Check className="h-5 w-5 text-success" />
                      </div>
                    ) : feature.others === "partial" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
                        <span className="text-sm text-warning">~</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <X className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Speed Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 shadow-xl">
            <h3 className="text-center text-xl font-bold text-[var(--marketing-text)]">
              Redirect Speed Comparison
            </h3>
            <p className="mt-2 text-center text-sm text-[var(--marketing-text-muted)]">
              Average time to redirect users to destination
            </p>

            <div className="mt-8 space-y-4">
              {/* Go2 */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-right text-sm font-medium text-[var(--marketing-text)]">
                  Go2
                </div>
                <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "8%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--marketing-accent)] to-[var(--marketing-accent-light)]"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-[var(--marketing-accent)]">
                    ~10ms
                  </div>
                </div>
              </div>

              {/* Competitors */}
              {[
                { name: "Bitly", speed: 150, width: "60%" },
                { name: "Rebrandly", speed: 200, width: "80%" },
                { name: "Short.io", speed: 180, width: "72%" },
                { name: "TinyURL", speed: 250, width: "100%" },
              ].map((competitor, index) => (
                <div key={competitor.name} className="flex items-center gap-4">
                  <div className="w-24 text-right text-sm text-[var(--marketing-text-muted)]">
                    {competitor.name}
                  </div>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: competitor.width }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-[var(--marketing-text-muted)]/30"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-[var(--marketing-text-muted)]">
                      ~{competitor.speed}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="group gap-2 shadow-lg shadow-[var(--marketing-accent)]/25 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-[var(--marketing-text-muted)]">
            14-day Pro trial. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

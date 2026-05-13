"use client";

import { motion } from "framer-motion";
import { Bot, MousePointerClick, Database, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Bot,
    title: "Agent calls Go2",
    body: "Invoke one of 16 MCP tools or hit REST. Agent context is auto-attached.",
  },
  {
    icon: MousePointerClick,
    title: "User clicks",
    body: "Edge resolves in <10ms globally. Click-time attribution via ?ag/?ar/?at/?au or x-agent-* headers.",
  },
  {
    icon: Database,
    title: "Click recorded",
    body: "D1 captures geo, device, browser, OS, referrer, bot — plus the four agent fields. Indexed per-link and per-run.",
  },
  {
    icon: BarChart3,
    title: "Query back",
    body: "Pull analytics, attribution, or run summaries via REST, MCP, or webhooks.",
  },
];

interface AttributionFlowProps {
  compact?: boolean;
}

export function AttributionFlow({ compact = false }: AttributionFlowProps) {
  return (
    <section
      className={
        compact
          ? "bg-[var(--marketing-bg)] py-16"
          : "bg-[var(--marketing-bg)] py-24 md:py-32"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!compact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
              How it works.
            </h2>
            <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
              Four steps. Edge-native. End to end on Cloudflare.
            </p>
          </motion.div>
        )}

        {compact && (
          <div className="mb-12 text-center">
            <h2 className="break-words font-bold text-2xl text-[var(--marketing-text)] md:text-3xl">
              How it works
            </h2>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative min-w-0"
              >
                <div className="h-full rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10">
                      <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
                    </div>
                    <span className="font-bold font-mono text-[var(--marketing-text-muted)] text-xs">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-base leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
                {/* Arrow between steps on lg+ */}
                {i < steps.length - 1 && (
                  <div className="-right-3 -translate-y-1/2 absolute top-1/2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg)] lg:flex">
                    <ArrowRight className="h-3 w-3 text-[var(--marketing-accent)]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

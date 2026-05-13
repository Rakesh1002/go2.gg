"use client";

import { motion } from "framer-motion";
import { Bot, Link2, MousePointerClick, BarChart3, ArrowRight } from "lucide-react";

interface Stage {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
  data?: { key: string; value: string }[];
}

const stages: Stage[] = [
  {
    icon: Bot,
    label: "1 · Agent creates link",
    body: "Your AI agent calls one of 16 MCP tools (or POSTs to /api/v1/links).",
    data: [
      { key: "agent_id", value: "claude-research" },
      { key: "agent_run_id", value: "run_2026_05_06_a4b8" },
    ],
  },
  {
    icon: Link2,
    label: "2 · Tracked link issued",
    body: "go2.gg/launch — branded, attribution-stamped, on your domain.",
    data: [
      { key: "actor_id", value: "user_42" },
      { key: "tool_call_id", value: "tc_91" },
    ],
  },
  {
    icon: MousePointerClick,
    label: "3 · User clicks",
    body: "Edge redirect resolves in ~8ms; click logged with the four fields.",
    data: [
      { key: "country", value: "US" },
      { key: "device", value: "mobile" },
    ],
  },
  {
    icon: BarChart3,
    label: "4 · Attribution returned",
    body: "Your dashboard rolls every click back to the run that produced it.",
    data: [
      { key: "clicks_for_run", value: "47" },
      { key: "conversions", value: "12" },
    ],
  },
];

export function AttributionLoop() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 px-3 py-1 font-medium text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
            How agent attribution works
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            From the prompt to the click — and back.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Every link your AI ships carries four attribution fields. Every click writes them back. The loop is the differentiator.
          </p>
        </motion.div>

        <div className="relative mx-auto grid max-w-6xl gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative min-w-0"
              >
                <div className="group h-full rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-5 transition-colors hover:border-[var(--marketing-accent)]/40 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 transition-colors group-hover:bg-[var(--marketing-accent)]/20">
                      <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
                    </div>
                    <span className="font-semibold text-[var(--marketing-text)] text-sm">
                      {stage.label}
                    </span>
                  </div>
                  <p className="mb-4 text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                    {stage.body}
                  </p>
                  {stage.data && (
                    <div className="space-y-1 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)]/60 p-3 font-mono text-[10px]">
                      {stage.data.map((d) => (
                        <div key={d.key} className="flex items-center justify-between gap-2">
                          <span className="truncate text-[var(--marketing-text-muted)]">
                            {d.key}
                          </span>
                          <span className="truncate text-[var(--marketing-accent)]">
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline arrow between cards on lg+ — sits in the right margin */}
                {i < stages.length - 1 && (
                  <div className="-right-3 -translate-y-1/2 absolute top-1/2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg)] lg:flex">
                    <ArrowRight className="h-3 w-3 text-[var(--marketing-accent)]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Loop hint — the one detail that separates this from a one-way pipeline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-5 py-3 text-center font-mono text-[11px] text-[var(--marketing-text-muted)] uppercase tracking-wider sm:text-xs"
        >
          <span className="text-[var(--marketing-accent)]">↻</span>
          <span>
            Stage 4 → Stage 1: feed attribution back to the agent for the next run
          </span>
        </motion.div>
      </div>
    </section>
  );
}

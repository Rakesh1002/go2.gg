"use client";

import { motion } from "framer-motion";
import {
  Link2,
  MousePointerClick,
  BarChart3,
  Bot,
  Clock,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Pillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tools: string;
}

const pillars: Pillar[] = [
  {
    icon: Link2,
    title: "Create",
    body: "Branded short URLs with custom slugs, geo/device targeting, password gating, OG previews.",
    tools: "create_link · bulk_create_links · update_link",
  },
  {
    icon: MousePointerClick,
    title: "Track",
    body: "Sub-10ms edge redirects. Every click logs geo, device, browser, OS, referrer, bot detection.",
    tools: "Click pipeline · webhooks · pixels",
  },
  {
    icon: BarChart3,
    title: "Analyze",
    body: "Per-link rollups: clicks over time, top countries, devices, browsers, referrers. Queryable from MCP.",
    tools: "get_analytics · /api/v1/analytics",
  },
  {
    icon: Bot,
    title: "Attribute",
    body: "Every link carries (agent_id, run_id, actor_id, tool_call_id). Rewind any click to the run that made it.",
    tools: "track_agent_link · get_run_attribution · list_agent_runs",
  },
  {
    icon: Clock,
    title: "Lifecycle",
    body: "Single-use, expiring, or run-revocable. One parameter; no cron jobs.",
    tools: "create_revocable_link · create_expiring_link · revoke_run_links",
  },
  {
    icon: Globe,
    title: "Distribute",
    body: "Custom domains via DNS-TXT, branded QR codes, link-in-bio, SMS-friendly previews.",
    tools: "Custom domains · QR · /api/v1/qr",
  },
];

export function ToolkitPillars() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Six capabilities. One MCP install.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Every capability is a tool. Pick what your agent needs.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "group min-w-0 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/40"
                )}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 transition-colors group-hover:bg-[var(--marketing-accent)]/20">
                  <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
                </div>
                <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">
                  {p.title}
                </h3>
                <p className="mb-4 break-words text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                  {p.body}
                </p>
                <p className="break-words border-[var(--marketing-border)] border-t pt-3 font-mono text-[11px] text-[var(--marketing-text-muted)] leading-relaxed">
                  {p.tools}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { BarChart3, Palette, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Pillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  detail: string;
}

const pillars: Pillar[] = [
  {
    icon: Palette,
    title: "Brand",
    body: "Your custom domain, your QR codes, your link-in-bio, your retargeting pixels. Every link comes out as yours — whether you, your team, or your AI created it.",
    detail: "Custom domains · QR · link-in-bio · 8 pixel platforms",
  },
  {
    icon: BarChart3,
    title: "Track",
    body: "Sub-10ms global redirects on Cloudflare's edge. Real-time and historical click analytics broken down by geo, device, referrer, and UTM. CSV export and API.",
    detail: "Click analytics · geo · device · referrer · UTM",
  },
  {
    icon: Shield,
    title: "Govern",
    body: "Revoke any link in one call. Set lifecycle rules per link. Single-use, expiring, password-gated. Audit who — or what — created every link.",
    detail: "single-use · expiring · revoke_run_links · audit logs",
  },
];

export function OwnerPillars() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-3 py-1 font-medium text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
            What you get
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Brand. Track. <span className="text-[var(--marketing-accent)]">Govern.</span>
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Whether you, your team, or your AI created the link — it lives on your domain, in your workspace, governed by you.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "group min-w-0 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-7 transition-colors hover:border-[var(--marketing-accent)]/40"
                )}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 transition-colors group-hover:bg-[var(--marketing-accent)]/20">
                  <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
                </div>
                <h3 className="mb-3 font-semibold text-[var(--marketing-text)] text-xl">
                  {p.title}
                </h3>
                <p className="mb-5 break-words text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                  {p.body}
                </p>
                <p className="break-words border-[var(--marketing-border)] border-t pt-3 font-mono text-[11px] text-[var(--marketing-text-muted)] leading-relaxed">
                  {p.detail}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

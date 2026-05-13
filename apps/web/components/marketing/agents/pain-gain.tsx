"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const todayLines = [
  "Agents return raw destination URLs",
  "No tracking, no analytics, no branding",
  "Generic shorteners drop agent context",
  "Roll-your-own = Postgres + hash table + click ledger",
  "Lifecycle (revoke, expire, single-use) is custom every time",
];

const withGo2Lines = [
  "One MCP call → branded short URL",
  "Every click logs geo, device, referrer, run_id",
  "Per-run attribution out of the box",
  "Lifecycle is a parameter: revocable, single-use, TTL",
  "Same data on dashboard, webhooks, and traces",
];

export function PainGain() {
  return (
    <section className="relative border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Your agent shouldn't return raw URLs.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Without a primitive, every link an agent ships is a dead URL.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Today */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="min-w-0 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6 sm:p-8"
          >
            <p className="mb-4 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
              Today, without a link toolkit
            </p>
            <h3 className="mb-6 font-bold text-2xl text-[var(--marketing-text)]">
              Agents return dead URLs
            </h3>
            <ul className="space-y-3">
              {todayLines.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <X className="h-3 w-3 text-red-500" />
                  </span>
                  <span className="text-[var(--marketing-text-muted)] leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With Go2 */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="min-w-0 rounded-2xl border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg-elevated)] p-6 shadow-[var(--marketing-accent)]/10 shadow-lg sm:p-8"
          >
            <p className="mb-4 font-bold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
              With Go2 wired in
            </p>
            <h3 className="mb-6 font-bold text-2xl text-[var(--marketing-text)]">
              Every link is a first-class object
            </h3>
            <ul className="space-y-3">
              {withGo2Lines.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                    <Check className="h-3 w-3 text-[var(--marketing-accent)]" />
                  </span>
                  <span className="text-[var(--marketing-text)] leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

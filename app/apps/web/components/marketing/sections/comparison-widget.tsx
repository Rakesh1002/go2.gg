"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface Competitor {
  name: string;
  value: string;
}

interface ComparisonWidgetProps {
  feature: string;
  headline?: string;
  go2: {
    value: string;
    highlight?: boolean;
  };
  competitors: Competitor[];
}

export function ComparisonWidget({ feature, headline, go2, competitors }: ComparisonWidgetProps) {
  return (
    <section className="relative py-16 md:py-20 bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          {headline && (
            <h3 className="text-center text-2xl font-bold text-[var(--marketing-text)] mb-8">
              {headline}
            </h3>
          )}

          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] overflow-hidden shadow-lg">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50">
              <div className="text-sm font-medium text-[var(--marketing-text-muted)]">
                {feature}
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-bold text-sm">
                  Go2
                </div>
              </div>
              <div className="text-center text-sm text-[var(--marketing-text-muted)]">Others</div>
            </div>

            {/* Go2 Row */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 p-4 bg-[var(--marketing-accent)]/5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-[var(--marketing-text)]">Go2</span>
              </div>
              <div className="text-center">
                <span
                  className={`text-lg font-bold ${
                    go2.highlight ? "text-green-500" : "text-[var(--marketing-text)]"
                  }`}
                >
                  {go2.value}
                </span>
              </div>
              <div />
            </motion.div>

            {/* Competitor Rows */}
            {competitors.map((competitor, index) => (
              <motion.div
                key={competitor.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="grid grid-cols-3 gap-4 p-4 border-t border-[var(--marketing-border)]"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-sm text-[var(--marketing-text-muted)]">
                    {competitor.name}
                  </span>
                </div>
                <div />
                <div className="text-center">
                  <span className="text-sm text-[var(--marketing-text-muted)]">
                    {competitor.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Savings callout */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6 text-sm text-[var(--marketing-text-muted)]"
          >
            Save up to <span className="font-bold text-green-500">$348/year</span> compared to
            competitors
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

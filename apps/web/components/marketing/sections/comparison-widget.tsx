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
    <section className="relative bg-[var(--marketing-bg)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          {headline && (
            <h3 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)]">
              {headline}
            </h3>
          )}

          <div className="overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-lg">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 border-[var(--marketing-border)] border-b bg-[var(--marketing-bg-elevated)]/50 p-4">
              <div className="font-medium text-[var(--marketing-text-muted)] text-sm">
                {feature}
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 font-bold text-[var(--marketing-accent)] text-sm">
                  Go2
                </div>
              </div>
              <div className="text-center text-[var(--marketing-text-muted)] text-sm">Others</div>
            </div>

            {/* Go2 Row */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 bg-[var(--marketing-accent)]/5 p-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <span className="font-medium text-[var(--marketing-text)] text-sm">Go2</span>
              </div>
              <div className="text-center">
                <span
                  className={`font-bold text-lg ${
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
                className="grid grid-cols-3 gap-4 border-[var(--marketing-border)] border-t p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-[var(--marketing-text-muted)] text-sm">
                    {competitor.name}
                  </span>
                </div>
                <div />
                <div className="text-center">
                  <span className="text-[var(--marketing-text-muted)] text-sm">
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
            className="mt-6 text-center text-[var(--marketing-text-muted)] text-sm"
          >
            Save up to <span className="font-bold text-green-500">$348/year</span> compared to
            competitors
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  dimension: string;
  dub: string | boolean;
  go2: string | boolean;
  highlight?: boolean;
}

const rows: Row[] = [
  {
    dimension: "Buyer",
    dub: "Partner-program manager at a scaled SaaS",
    go2: "Engineer or team shipping AI agents (or both)",
    highlight: true,
  },
  {
    dimension: "Core data model",
    dub: "Partner clicks → conversions → payouts",
    go2: "Agent run → click → conversion (per-run granularity)",
    highlight: true,
  },
  {
    dimension: "MCP server",
    dub: false,
    go2: true,
    highlight: true,
  },
  {
    dimension: "Per-run agent attribution",
    dub: false,
    go2: true,
    highlight: true,
  },
  {
    dimension: "Pricing entry",
    dub: "$25/mo · 1K links",
    go2: "$9/mo · 2K links",
  },
  {
    dimension: "Free tier",
    dub: "25 links/mo",
    go2: "100 links/mo · 5K clicks/mo",
  },
  {
    dimension: "Self-host",
    dub: "Possible, not first-class",
    go2: "First-class · single wrangler deploy",
  },
  {
    dimension: "License",
    dub: "AGPL with commercial dual-license",
    go2: "AGPL · $5K/yr commercial license",
  },
  {
    dimension: "Roadmap focus",
    dub: "Affiliate / partner programs",
    go2: "MCP server · agent attribution · branded links",
  },
];

export function ComparisonVsDub() {
  return (
    <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Dub for marketers. Go2 for engineers.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Different buyers. Different questions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-[var(--marketing-border)] border-b bg-[var(--marketing-bg-elevated)]">
                  <th className="w-2/5 px-6 py-4 text-left font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                    Dimension
                  </th>
                  <th className="w-3/10 px-6 py-4 text-left font-semibold text-[var(--marketing-text)] text-sm">
                    Dub.co
                  </th>
                  <th className="w-3/10 bg-[var(--marketing-accent)]/5 px-6 py-4 text-left font-semibold text-[var(--marketing-accent)] text-sm">
                    Go2
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.dimension}
                    className={cn(
                      "border-[var(--marketing-border)]/30 border-b",
                      i % 2 === 1 && "bg-[var(--marketing-bg-elevated)]/30",
                      row.highlight && "bg-[var(--marketing-accent)]/[0.02]"
                    )}
                  >
                    <td className="px-6 py-4 font-medium text-[var(--marketing-text)] text-sm">
                      {row.dimension}
                    </td>
                    <td className="px-6 py-4 text-[var(--marketing-text-muted)] text-sm">
                      <Cell value={row.dub} />
                    </td>
                    <td className="bg-[var(--marketing-accent)]/5 px-6 py-4 text-sm">
                      <Cell value={row.go2} highlight />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-10 max-w-3xl text-center text-[var(--marketing-text-muted)] text-base leading-relaxed"
        >
          Use <strong className="text-[var(--marketing-text)]">Dub</strong> if your buyer-question
          is "what attribution did Justin's tweet drive?" Use{" "}
          <strong className="text-[var(--marketing-accent)]">Go2</strong> if your buyer-question is
          "what did the Claude run my user just had do?"
        </motion.p>
      </div>
    </section>
  );
}

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className={cn(
          "h-5 w-5",
          highlight ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text-muted)]"
        )}
      />
    ) : (
      <X className="h-5 w-5 text-[var(--marketing-text-muted)]/40" />
    );
  }
  return (
    <span
      className={cn(highlight ? "text-[var(--marketing-text)]" : "text-[var(--marketing-text-muted)]")}
    >
      {value}
    </span>
  );
}

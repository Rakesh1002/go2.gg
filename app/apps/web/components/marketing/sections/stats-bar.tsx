"use client";

import { motion } from "framer-motion";
import { AnimatedCounter, AnimatedPercentage } from "@/components/ui/animated-counter";

const stats = [
  {
    label: "Redirect speed",
    value: 10,
    prefix: "<",
    suffix: "ms",
    description: "Globally on edge network",
  },
  {
    label: "Edge locations",
    value: 310,
    suffix: "+",
    description: "Worldwide coverage",
  },
  {
    label: "Links shortened",
    value: 50,
    suffix: "M+",
    description: "Growing every second",
  },
  {
    label: "Uptime SLA",
    value: 99.99,
    suffix: "%",
    description: "Enterprise reliability",
  },
];

export function StatsBar() {
  return (
    <section className="py-20 border-y border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-[var(--marketing-text)] mb-2">
                <AnimatedCounter
                  value={stat.value}
                  duration={2000}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.value % 1 !== 0 ? 2 : 0}
                />
              </div>
              <div className="text-sm font-bold text-[var(--marketing-text)] uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-[var(--marketing-text-muted)]">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

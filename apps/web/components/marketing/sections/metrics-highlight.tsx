"use client";

import { motion } from "framer-motion";

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface MetricsHighlightProps {
  headline?: string;
  stats: Stat[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export function MetricsHighlight({ headline, stats }: MetricsHighlightProps) {
  return (
    <section className="relative border-[var(--marketing-border)] border-y bg-gradient-to-r from-[var(--marketing-accent)]/5 via-[var(--marketing-bg)] to-[var(--marketing-accent)]/5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        {headline && (
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center font-semibold text-[var(--marketing-text-muted)] text-lg"
          >
            {headline}
          </motion.h3>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="group relative text-center"
            >
              {/* Glow effect on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[var(--marketing-accent)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="relative font-bold text-4xl text-[var(--marketing-accent)] md:text-5xl"
              >
                {stat.value}
              </motion.div>
              <div className="relative mt-2 font-semibold text-[var(--marketing-text)] text-base">
                {stat.label}
              </div>
              {stat.description && (
                <div className="relative mt-1 text-[var(--marketing-text-muted)] text-sm">
                  {stat.description}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

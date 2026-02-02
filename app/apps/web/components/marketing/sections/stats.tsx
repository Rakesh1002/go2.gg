"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatsProps {
  headline?: string;
  subheadline?: string;
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  {
    value: "50M+",
    label: "Links shortened",
    description: "and counting every day",
  },
  {
    value: "<10ms",
    label: "Redirect speed",
    description: "globally on edge network",
  },
  {
    value: "310+",
    label: "Edge locations",
    description: "worldwide coverage",
  },
  {
    value: "99.99%",
    label: "Uptime SLA",
    description: "enterprise reliability",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export function Stats({
  headline = "Powering millions of links worldwide",
  subheadline,
  stats = defaultStats,
}: StatsProps) {
  return (
    <section className="relative overflow-hidden border-y bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
      {/* Animated background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        {(headline || subheadline) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            {headline && <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">{headline}</h2>}
            {subheadline && <p className="mt-3 text-primary-foreground/80">{subheadline}</p>}
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="group relative text-center"
            >
              {/* Glow effect on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="relative text-4xl font-bold md:text-5xl lg:text-6xl"
              >
                {stat.value}
              </motion.div>
              <div className="relative mt-3 text-lg font-semibold">{stat.label}</div>
              {stat.description && (
                <div className="relative mt-1 text-sm text-primary-foreground/70">
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

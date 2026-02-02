"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@repo/config";
import { ArrowRight, Zap, Globe, Link2, Sparkles } from "lucide-react";

interface HeroProps {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
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

const floatingVariants = {
  animate: {
    y: [-4, 4, -4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export function Hero({
  badge = "The Edge-Native Link Platform",
  title = "Shorten links.",
  titleHighlight = "Track everything.",
  description = siteConfig.description,
  primaryCTA = { text: "Start free", href: "/register" },
  secondaryCTA = { text: "View docs", href: "/docs" },
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[var(--marketing-accent)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[var(--marketing-accent-light)]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[800px] -translate-x-1/2 bg-gradient-to-t from-[var(--marketing-accent)]/5 to-transparent" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32 lg:py-40 lg:px-8"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <Badge
            variant="outline"
            className="group gap-2 border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-2 text-sm backdrop-blur-sm transition-all hover:border-[var(--marketing-accent)]/30 hover:bg-[var(--marketing-accent)]/10"
          >
            <Zap className="h-3.5 w-3.5 text-[var(--marketing-accent)]" />
            <span className="text-[var(--marketing-text)]">{badge}</span>
            <Sparkles className="h-3 w-3 text-[var(--marketing-accent-light)] opacity-0 transition-opacity group-hover:opacity-100" />
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">{title}</span>
            <span className="block text-gradient">{titleHighlight}</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl"
        >
          {description}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link href={primaryCTA.href}>
            <Button
              size="lg"
              className="group h-12 gap-2 px-8 shadow-lg shadow-[var(--marketing-accent)]/20 transition-all hover:shadow-xl hover:shadow-[var(--marketing-accent)]/25 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
            >
              {primaryCTA.text}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          {secondaryCTA && (
            <Link href={secondaryCTA.href}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 px-8 backdrop-blur-sm border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                {secondaryCTA.text}
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-[var(--marketing-text-muted)]"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent)]/5 text-[var(--marketing-accent)]">
              <Zap className="h-4 w-4" />
            </div>
            <span>Sub-10ms redirects</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent-light)]/5 text-[var(--marketing-accent-light)]">
              <Globe className="h-4 w-4" />
            </div>
            <span>310+ edge locations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent)]/5 text-[var(--marketing-accent)]">
              <Link2 className="h-4 w-4" />
            </div>
            <span>50M+ links shortened</span>
          </div>
        </motion.div>

        {/* Floating demo preview */}
        <motion.div variants={itemVariants} className="relative mt-8 w-full max-w-3xl">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-4 shadow-xl backdrop-blur-xl"
          >
            {/* Browser chrome */}
            <div className="mb-4 flex items-center gap-3 border-b border-[var(--marketing-border)] pb-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-chrome-red/50" />
                <div className="h-3 w-3 rounded-full bg-chrome-yellow/50" />
                <div className="h-3 w-3 rounded-full bg-chrome-green/50" />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-[var(--marketing-bg-elevated)]/50 px-4 py-2 text-sm">
                <Link2 className="h-4 w-4 text-[var(--marketing-text-muted)]" />
                <span className="text-[var(--marketing-text-muted)]">go2.gg/</span>
                <span className="font-medium text-[var(--marketing-accent)]">your-link</span>
              </div>
            </div>

            {/* Link preview content */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--marketing-accent)]/5 p-4 border border-[var(--marketing-accent)]/10">
                <p className="text-3xl font-bold text-[var(--marketing-accent)]">2.4K</p>
                <p className="text-sm text-[var(--marketing-text-muted)]">Total clicks</p>
              </div>
              <div className="rounded-xl bg-[var(--marketing-accent-light)]/5 p-4 border border-[var(--marketing-accent-light)]/10">
                <p className="text-3xl font-bold text-[var(--marketing-accent-light)]">45%</p>
                <p className="text-sm text-[var(--marketing-text-muted)]">Click rate</p>
              </div>
              <div className="rounded-xl bg-[var(--marketing-bg-elevated)] p-4 border border-[var(--marketing-border)]">
                <p className="text-3xl font-bold text-[var(--marketing-text)]">12</p>
                <p className="text-sm text-[var(--marketing-text-muted)]">Countries</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-[var(--marketing-accent)]/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--marketing-accent-light)]/10 blur-2xl" />
        </motion.div>
      </motion.div>
    </section>
  );
}

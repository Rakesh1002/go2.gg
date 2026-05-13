"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@repo/config";
import { ArrowRight, Zap, Globe, Link2, Sparkles } from "lucide-react";
import { TryItShortener } from "./try-it-shortener";

interface HeroProps {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  /** When true, renders the anonymous "try it now" shortener under the CTA. */
  showTryIt?: boolean;
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
      repeat: Number.POSITIVE_INFINITY,
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
  showTryIt = true,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="-left-40 -top-40 pointer-events-none absolute h-96 w-96 rounded-full bg-[var(--marketing-accent)]/10 blur-3xl" />
      <div className="-right-40 pointer-events-none absolute top-20 h-96 w-96 rounded-full bg-[var(--marketing-accent-light)]/10 blur-3xl" />
      <div className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-64 w-[800px] bg-gradient-to-t from-[var(--marketing-accent)]/5 to-transparent" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8 lg:py-40"
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
          <h1 className="font-bold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">{title}</span>
            <span className="block text-gradient">{titleHighlight}</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="max-w-2xl text-[var(--marketing-text-muted)] text-lg sm:text-xl"
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
              className="group h-12 gap-2 bg-[var(--marketing-accent)] px-8 text-white shadow-[var(--marketing-accent)]/20 shadow-lg transition-all hover:bg-[var(--marketing-accent-light)] hover:shadow-[var(--marketing-accent)]/25 hover:shadow-xl"
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
                className="h-12 gap-2 border-[var(--marketing-border)] bg-transparent px-8 text-[var(--marketing-text)] backdrop-blur-sm hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
              >
                {secondaryCTA.text}
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Anonymous "try it now" shortener — top-of-funnel hook */}
        {showTryIt && <TryItShortener />}

        {/* Trust indicators */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-8 pt-8 text-[var(--marketing-text-muted)] text-sm"
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
            <div className="mb-4 flex items-center gap-3 border-[var(--marketing-border)] border-b pb-4">
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
              <div className="rounded-xl border border-[var(--marketing-accent)]/10 bg-[var(--marketing-accent)]/5 p-4">
                <p className="font-bold text-3xl text-[var(--marketing-accent)]">2.4K</p>
                <p className="text-[var(--marketing-text-muted)] text-sm">Total clicks</p>
              </div>
              <div className="rounded-xl border border-[var(--marketing-accent-light)]/10 bg-[var(--marketing-accent-light)]/5 p-4">
                <p className="font-bold text-3xl text-[var(--marketing-accent-light)]">45%</p>
                <p className="text-[var(--marketing-text-muted)] text-sm">Click rate</p>
              </div>
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
                <p className="font-bold text-3xl text-[var(--marketing-text)]">12</p>
                <p className="text-[var(--marketing-text-muted)] text-sm">Countries</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="-bottom-4 -left-4 pointer-events-none absolute h-24 w-24 rounded-full bg-[var(--marketing-accent)]/10 blur-2xl" />
          <div className="-right-4 -top-4 pointer-events-none absolute h-24 w-24 rounded-full bg-[var(--marketing-accent-light)]/10 blur-2xl" />
        </motion.div>
      </motion.div>
    </section>
  );
}

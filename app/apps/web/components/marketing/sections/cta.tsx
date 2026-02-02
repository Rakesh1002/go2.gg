"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTAProps {
  headline?: string;
  description?: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
}

export function CTA({
  headline = "Start shortening links in seconds",
  description = "Launch faster with real-time analytics and automation.",
  primaryCTA = { text: "Start free", href: "/register" },
  secondaryCTA,
}: CTAProps) {
  return (
    <section className="relative overflow-hidden border-t border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--marketing-accent)]/5 to-transparent" />
      <div className="pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-[var(--marketing-accent)]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[var(--marketing-accent)]/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-[var(--marketing-text)] md:text-5xl lg:text-6xl max-w-4xl"
        >
          {headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-xl text-lg text-[var(--marketing-text-muted)] md:text-xl"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-6 w-full"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <Link href={primaryCTA.href}>
              <Button
                size="lg"
                className="group h-14 gap-2 px-10 text-lg font-bold rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] shadow-xl shadow-[var(--marketing-accent)]/20 hover-lift"
              >
                {primaryCTA.text}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            {secondaryCTA && (
              <Link href={secondaryCTA.href}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-lg font-bold rounded-full border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)] bg-transparent hover-lift"
                >
                  {secondaryCTA.text}
                </Button>
              </Link>
            )}
          </div>

          <p className="text-sm text-[var(--marketing-text-muted)]">
            14-day Pro trial · No credit card required
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Upload, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MigrationCTAProps {
  headline?: string;
  description?: string;
  competitor?: string;
  features?: string[];
}

const defaultFeatures = [
  "Import all links in one click",
  "Keep your click history",
  "Automatic domain migration",
];

export function MigrationCTA({
  headline,
  description,
  competitor = "another provider",
  features = defaultFeatures,
}: MigrationCTAProps) {
  const displayHeadline = headline || `Switching from ${competitor}?`;
  const displayDescription =
    description ||
    "We make it easy to migrate. Import your links, keep your analytics, and start saving immediately.";

  return (
    <section className="relative bg-[var(--marketing-bg)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl rounded-2xl border border-[var(--marketing-border)] bg-gradient-to-br from-[var(--marketing-bg-elevated)] to-[var(--marketing-accent)]/5 p-8 shadow-xl md:p-12"
        >
          <div className="grid items-center gap-8 md:grid-cols-2">
            {/* Left content */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 font-medium text-[var(--marketing-accent)] text-sm">
                <Upload className="h-4 w-4" />
                Easy Migration
              </div>
              <h3 className="font-bold text-2xl text-[var(--marketing-text)] md:text-3xl">
                {displayHeadline}
              </h3>
              <p className="mt-4 text-[var(--marketing-text-muted)]">{displayDescription}</p>

              <div className="mt-8">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group gap-2 bg-[var(--marketing-accent)] text-white shadow-[var(--marketing-accent)]/25 shadow-lg hover:bg-[var(--marketing-accent-light)]"
                  >
                    Start free migration
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right content - features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    {index === 0 && <Upload className="h-5 w-5 text-green-500" />}
                    {index === 1 && <Shield className="h-5 w-5 text-green-500" />}
                    {index === 2 && <Zap className="h-5 w-5 text-green-500" />}
                  </div>
                  <span className="font-medium text-[var(--marketing-text)] text-sm">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

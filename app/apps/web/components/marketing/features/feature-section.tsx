"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

interface FeatureSectionProps {
  title: string;
  description: string;
  features?: string[];
  image: ReactNode;
  align?: "left" | "right";
  icon?: ReactNode;
  cta?: { text: string; href: string };
  badge?: string;
}

export function FeatureSection({
  title,
  description,
  features,
  image,
  align = "left",
  icon,
  cta,
  badge,
}: FeatureSectionProps) {
  return (
    <div className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: align === "left" ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(
              "flex flex-col gap-6",
              align === "right" && "lg:order-2",
            )}
          >
            <div>
              {badge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-3 py-1 text-xs font-semibold text-[var(--marketing-accent)] mb-6">
                  {icon && <span className="mr-1">{icon}</span>}
                  {badge}
                </div>
              )}
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--marketing-text)] mb-4">
                {title}
              </h2>
              <p className="text-lg text-[var(--marketing-text-muted)] leading-relaxed">
                {description}
              </p>
            </div>

            {features && (
              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-[var(--marketing-text)]"
                  >
                    <div className="mt-1 h-5 w-5 rounded-full bg-[var(--marketing-accent)]/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-[var(--marketing-accent)]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {cta && (
              <div className="pt-4">
                <Link
                  href={cta.href}
                  className="inline-flex items-center text-[var(--marketing-accent)] font-semibold hover:text-[var(--marketing-accent-light)] transition-colors group"
                >
                  {cta.text}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </motion.div>

          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              "relative rounded-3xl overflow-hidden border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-2xl shadow-[var(--marketing-accent)]/5 aspect-square lg:aspect-auto lg:h-[500px] flex items-center justify-center p-8",
              align === "right" && "lg:order-1",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--marketing-accent)]/5 via-transparent to-[var(--marketing-accent)]/5 opacity-50" />

            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {image}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

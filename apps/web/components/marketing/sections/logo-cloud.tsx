"use client";

import { motion } from "framer-motion";
import { logoCloudCompanies } from "@repo/config";

interface LogoCloudProps {
  headline?: string;
  logos?: Array<{ name: string; logo: string }>;
}

export function LogoCloud({
  headline = "Trusted by 8,000+ brands around the world",
  logos = logoCloudCompanies,
}: LogoCloudProps) {
  // Duplicate logos for infinite scroll effect
  const repeatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="relative overflow-hidden border-[var(--marketing-border)] border-y bg-[var(--marketing-bg)]/50 py-16">
      <div className="mx-auto mb-10 max-w-7xl px-4 text-center">
        <p className="font-semibold text-[var(--marketing-text-muted)] text-sm uppercase tracking-widest">
          {headline}
        </p>
      </div>

      <div className="mask-gradient-x relative flex w-full overflow-hidden">
        {/* Fade edges */}
        <div className="absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r from-[var(--marketing-bg)] to-transparent" />
        <div className="absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l from-[var(--marketing-bg)] to-transparent" />

        <motion.div
          className="flex min-w-full items-center gap-12 px-12 sm:gap-24"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 50,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            repeatType: "loop",
          }}
        >
          {repeatedLogos.map((company, idx) => (
            <div
              key={`${company.name}-${idx}`}
              className="flex shrink-0 cursor-pointer items-center gap-3 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              {/* Logo placeholder - replacing with tech company style */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 font-bold text-[var(--marketing-accent)] text-lg">
                  {company.name.charAt(0)}
                </div>
                <span className="font-bold text-[var(--marketing-text)] text-xl">
                  {company.name}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

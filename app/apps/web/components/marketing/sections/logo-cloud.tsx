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
    <section className="relative overflow-hidden py-16 border-y border-[var(--marketing-border)] bg-[var(--marketing-bg)]/50">
      <div className="max-w-7xl mx-auto px-4 text-center mb-10">
        <p className="text-sm font-semibold text-[var(--marketing-text-muted)] uppercase tracking-widest">
          {headline}
        </p>
      </div>

      <div className="relative flex w-full overflow-hidden mask-gradient-x">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[var(--marketing-bg)] to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[var(--marketing-bg)] to-transparent" />

        <motion.div
          className="flex min-w-full items-center gap-12 sm:gap-24 px-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          }}
        >
          {repeatedLogos.map((company, idx) => (
            <div
              key={`${company.name}-${idx}`}
              className="flex shrink-0 items-center gap-3 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 cursor-pointer"
            >
              {/* Logo placeholder - replacing with tech company style */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-bold text-lg">
                  {company.name.charAt(0)}
                </div>
                <span className="text-xl font-bold text-[var(--marketing-text)]">
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

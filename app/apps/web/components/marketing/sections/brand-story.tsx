"use client";

import { motion } from "framer-motion";
import { Heart, Code, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const milestones = [
  {
    icon: Heart,
    title: "Built for modern teams",
    description:
      "Legacy shorteners were designed for a different era. Go2 is a clean-slate product for today’s workflows.",
  },
  {
    icon: Code,
    title: "Open by default",
    description:
      "Auditable, community-driven, and transparent—no black boxes or lock-in.",
  },
  {
    icon: Rocket,
    title: "Edge-native speed",
    description:
      "Cloudflare Workers from day one for fast, global redirects.",
  },
  {
    icon: Users,
    title: "Developer-grade UX",
    description:
      "Clear APIs, reliable SDKs, and docs that respect your time.",
  },
];

export function BrandStory() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-[var(--marketing-bg)] to-[var(--marketing-bg-elevated)]/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Story */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-6">
                <Heart className="h-4 w-4" />
                <span>Our Story</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--marketing-text)] leading-tight">
                A link platform built for speed.{" "}
                <span className="text-gradient-warm">And built for teams.</span>
              </h2>
            </div>

            <p className="text-lg text-[var(--marketing-text-muted)] leading-relaxed">
              Go2 replaces legacy tooling with a modern platform: fast redirects, transparent
              pricing, and a product designed for developers and growth teams.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/about">
                <Button
                  variant="outline"
                  className="rounded-full border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]/30"
                >
                  Read our full story
                </Button>
              </Link>
              <Link href="https://github.com/rakesh1002/go2" target="_blank">
                <Button
                  variant="ghost"
                  className="rounded-full text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)]"
                >
                  View on GitHub
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right side - Milestones */}
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex gap-5 p-5 rounded-2xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] hover:border-[var(--marketing-accent)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--marketing-accent)]/5"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[var(--marketing-accent)]/10 flex items-center justify-center group-hover:bg-[var(--marketing-accent)] group-hover:text-white transition-colors">
                    <milestone.icon className="h-6 w-6 text-[var(--marketing-accent)] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--marketing-text)] mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-[var(--marketing-text-muted)] leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

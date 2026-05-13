"use client";

import { motion } from "framer-motion";
import { Heart, Code, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const milestones = [
  {
    icon: Heart,
    title: "Built for AI agents",
    description:
      "Your agent generates URLs every run, but has no way to track them, control them, or know which run drove a click. Go2 is the link primitive agents never had.",
  },
  {
    icon: Code,
    title: "Open by default",
    description:
      "Auditable, AGPL, transparent—no black boxes or lock-in. Self-host on your own Cloudflare account.",
  },
  {
    icon: Rocket,
    title: "Edge-native speed",
    description:
      "Sub-10ms redirects on Cloudflare Workers + KV. Global by default.",
  },
  {
    icon: Users,
    title: "Agent-first UX",
    description:
      "MCP server + REST API + OAuth 2.1. Built so agents call it before humans do.",
  },
];

export function BrandStory() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--marketing-bg)] to-[var(--marketing-bg-elevated)]/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left side - Story */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
                <Heart className="h-4 w-4" />
                <span>Our Story</span>
              </div>
              <h2 className="font-bold text-3xl text-[var(--marketing-text)] leading-tight md:text-4xl lg:text-5xl">
                The link primitive your agent calls.{" "}
                <span className="text-gradient-warm">Not the marketer's dashboard.</span>
              </h2>
            </div>

            <p className="text-[var(--marketing-text-muted)] text-lg leading-relaxed">
              Every meaningful link an AI agent shares is a link the team needs to track,
              attribute, and revoke. Go2 is the toolkit for that — built MCP-first, edge-native,
              AGPL.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/about">
                <Button
                  variant="outline"
                  className="rounded-full border-[var(--marketing-border)] text-[var(--marketing-text)] hover:border-[var(--marketing-accent)]/30 hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
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
                className="group flex gap-5 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-5 transition-all duration-300 hover:border-[var(--marketing-accent)]/30 hover:shadow-[var(--marketing-accent)]/5 hover:shadow-lg"
              >
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                    <milestone.icon className="h-6 w-6 text-[var(--marketing-accent)] transition-colors group-hover:text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[var(--marketing-text)]">
                    {milestone.title}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)] text-sm leading-relaxed">
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

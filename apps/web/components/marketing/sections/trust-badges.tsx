"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Globe,
  Clock,
  Github,
  Award,
} from "lucide-react";

const badges = [
  {
    icon: Lock,
    title: "GDPR Aware",
    description: "Privacy by design",
  },
  {
    icon: Globe,
    title: "Cloudflare Edge",
    description: "330+ cities, sub-10ms",
  },
  {
    icon: Clock,
    title: "99.9% Uptime SLA",
    description: "On Business + Scale",
  },
  {
    icon: Github,
    title: "Open Source",
    description: "Transparent & auditable",
  },
  {
    icon: Award,
    title: "No Lock-in",
    description: "Export anytime",
  },
  {
    icon: Shield,
    title: "MCP-native",
    description: "Your AI ships tracked links",
  },
];

export function TrustBadges() {
  return (
    <section className="bg-[var(--marketing-bg)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h3 className="font-bold text-[var(--marketing-text-muted)] text-sm uppercase tracking-wider">
            Security, privacy, and reliability by design
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 text-center transition-colors hover:border-[var(--marketing-accent)]/20"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10">
                <badge.icon className="h-5 w-5 text-[var(--marketing-accent)]" />
              </div>
              <h4 className="mb-1 font-bold text-[var(--marketing-text)] text-sm">
                {badge.title}
              </h4>
              <p className="text-[var(--marketing-text-muted)] text-xs">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

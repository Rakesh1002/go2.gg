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
    icon: Shield,
    title: "SOC 2 Type II",
    description: "Enterprise-grade security",
  },
  {
    icon: Lock,
    title: "GDPR Compliant",
    description: "Privacy by design",
  },
  {
    icon: Globe,
    title: "310+ Edge Locations",
    description: "Global coverage",
  },
  {
    icon: Clock,
    title: "99.99% Uptime SLA",
    description: "Enterprise reliability",
  },
  {
    icon: Github,
    title: "Open Source",
    description: "Transparent & auditable",
  },
  {
    icon: Award,
    title: "No Vendor Lock-in",
    description: "Export anytime",
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-sm font-bold text-[var(--marketing-text-muted)] uppercase tracking-wider">
            Security, privacy, and reliability by design
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] hover:border-[var(--marketing-accent)]/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--marketing-accent)]/10 flex items-center justify-center mb-3">
                <badge.icon className="h-5 w-5 text-[var(--marketing-accent)]" />
              </div>
              <h4 className="font-bold text-sm text-[var(--marketing-text)] mb-1">
                {badge.title}
              </h4>
              <p className="text-xs text-[var(--marketing-text-muted)]">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

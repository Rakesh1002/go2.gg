"use client";

import { motion } from "framer-motion";
import {
  Megaphone,
  Code2,
  Building2,
  Users,
  ShoppingBag,
  Podcast,
} from "lucide-react";

const useCases = [
  {
    icon: Megaphone,
    title: "Marketers",
    description:
      "Track campaigns across channels. A/B test destinations. Measure what works.",
    features: ["UTM builder", "Geo-targeting", "Conversion tracking"],
  },
  {
    icon: Code2,
    title: "Developers",
    description:
      "REST API, TypeScript SDK, webhooks. Build custom integrations in minutes.",
    features: ["Full API access", "Webhooks", "Self-hosting"],
  },
  {
    icon: Building2,
    title: "Enterprises",
    description:
      "Team collaboration, role-based access, audit logs. Scale with confidence.",
    features: ["SSO/SAML", "Team management", "SLA guarantee"],
  },
  {
    icon: Users,
    title: "Agencies",
    description:
      "Manage multiple clients, white-label domains, bulk operations.",
    features: ["Multi-workspace", "Client billing", "API automation"],
  },
  {
    icon: ShoppingBag,
    title: "E-commerce",
    description:
      "Product links, retargeting pixels, deep links to mobile apps.",
    features: ["Deep links", "Pixel tracking", "Revenue attribution"],
  },
  {
    icon: Podcast,
    title: "Creators",
    description:
      "Link-in-bio pages, custom branding, social sharing optimization.",
    features: ["Bio pages", "Custom CSS", "OG customization"],
  },
];

export function UseCases() {
  return (
    <section className="py-24 md:py-32 bg-[var(--marketing-bg-elevated)]/50 border-y border-[var(--marketing-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--marketing-text)] mb-6">
            Built for <span className="text-gradient-warm">everyone</span> who
            shares links
          </h2>
          <p className="text-lg text-[var(--marketing-text-muted)]">
            From solo creators to enterprise teams. Go2 scales with your needs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6 hover:border-[var(--marketing-accent)]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--marketing-accent)]/5 overflow-hidden"
            >
              {/* Gradient accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 flex items-center justify-center mb-4 group-hover:bg-[var(--marketing-accent)] group-hover:border-[var(--marketing-accent)] transition-colors duration-300">
                  <useCase.icon className="h-6 w-6 text-[var(--marketing-accent)] group-hover:text-white transition-colors duration-300" />
                </div>

                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  {useCase.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)] mb-4 text-sm leading-relaxed">
                  {useCase.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {useCase.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] text-[var(--marketing-text-muted)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

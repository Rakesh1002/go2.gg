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
    <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <h2 className="mb-6 font-bold text-3xl text-[var(--marketing-text)] md:text-4xl lg:text-5xl">
            Built for <span className="text-gradient-warm">everyone</span> who
            shares links
          </h2>
          <p className="text-[var(--marketing-text-muted)] text-lg">
            From solo creators to enterprise teams. Go2 scales with your needs.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6 transition-all duration-300 hover:border-[var(--marketing-accent)]/30 hover:shadow-[var(--marketing-accent)]/5 hover:shadow-xl"
            >
              {/* Gradient accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] opacity-0 transition-opacity duration-300 group-hover:opacity-5" />

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 transition-colors duration-300 group-hover:border-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)]">
                  <useCase.icon className="h-6 w-6 text-[var(--marketing-accent)] transition-colors duration-300 group-hover:text-white" />
                </div>

                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  {useCase.title}
                </h3>
                <p className="mb-4 text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                  {useCase.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {useCase.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-2.5 py-1 font-medium text-[var(--marketing-text-muted)] text-xs"
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

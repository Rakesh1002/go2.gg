"use client";

import { motion } from "framer-motion";
import { Briefcase, Sparkles, ShoppingBag, Code2 } from "lucide-react";

const useCases = [
  {
    icon: Briefcase,
    title: "Agencies & marketers",
    body: "Brand every campaign link with your client's domain. QR for print, link-in-bio for social, pixels for retargeting — all in one workspace.",
    examples: "Custom domain · QR · UTM · 8 pixel platforms",
  },
  {
    icon: Sparkles,
    title: "Creators",
    body: "One link-in-bio page on your domain. Every short link, every QR, every click — in your dashboard, not a third-party silo.",
    examples: "Link-in-bio · custom slugs · QR for streams",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce",
    body: "Branded product links for paid social and email. Track which channel converts. Add retargeting pixels per link, per campaign.",
    examples: "Meta · Google Ads · TikTok pixels · Shopify",
  },
  {
    icon: Code2,
    title: "Indie SaaS & teams",
    body: "Replace bit.ly across the team. Add API access for your app. Let your AI agent ship tracked links from day one — same workspace.",
    examples: "REST API · MCP · webhooks · team seats",
  },
];

export function OwnerUseCases() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-3 py-1 font-medium text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
            For your team
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Built for the work you actually do.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            One platform. Every channel. Your domain.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="min-w-0 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/40 sm:p-8"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10">
                  <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
                </div>
                <h3 className="mb-3 font-semibold text-[var(--marketing-text)] text-xl">
                  {uc.title}
                </h3>
                <p className="mb-4 break-words text-[var(--marketing-text-muted)] leading-relaxed">
                  {uc.body}
                </p>
                <p className="break-words border-[var(--marketing-border)] border-t pt-4 font-mono text-[var(--marketing-text-muted)] text-xs">
                  {uc.examples}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

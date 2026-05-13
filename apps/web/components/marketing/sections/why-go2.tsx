"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Sparkles,
  Bot,
  Timer,
  Shield,
  Palette,
  Server,
  Ban,
} from "lucide-react";

const differentiators = [
  {
    icon: Zap,
    title: "Global speed",
    description: "Millisecond redirects worldwide, built for reliability at scale.",
    highlight: "<10ms",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Sparkles,
    title: "AI-Styled QR Codes",
    description:
      "Generate branded QR codes with AI. Stand out from generic patterns.",
    highlight: "AI-Powered",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Bot,
    title: "AI Assistant Ready",
    description:
      "MCP server integration. Works with Claude, ChatGPT, and other AI tools.",
    highlight: "MCP Server",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Timer,
    title: "Click Limits",
    description:
      "Self-destructing links after X clicks. Perfect for limited offers.",
    highlight: "Unique",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    description:
      "IP hashing by default. GDPR-compliant without compromising analytics.",
    highlight: "GDPR Ready",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Palette,
    title: "Custom CSS Bio Pages",
    description:
      "Full design control for link-in-bio. No templates, pure creativity.",
    highlight: "Full Control",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Server,
    title: "Self-Hostable",
    description:
      "Own your infrastructure. Deploy on your own Cloudflare account.",
    highlight: "Open Source",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Ban,
    title: "No Ads. Ever.",
    description:
      "Your links stay clean. No interstitials, no branding on paid plans.",
    highlight: "Ad-Free",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export function WhyGo2() {
  return (
    <section className="relative overflow-hidden bg-[var(--marketing-bg)] py-24 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-0 h-96 w-96 rounded-full bg-[var(--marketing-accent)]/5 blur-3xl" />
        <div className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Sparkles className="h-4 w-4" />
            <span>What Makes Us Different</span>
          </div>
          <h2 className="mb-6 font-bold text-3xl text-[var(--marketing-text)] md:text-4xl lg:text-5xl">
            8 things competitors{" "}
            <span className="text-gradient-warm">can&apos;t copy</span>
          </h2>
          <p className="text-[var(--marketing-text-muted)] text-lg">
            Built for low latency from day one. These aren&apos;t add-ons—they&apos;re the foundation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {differentiators.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="group hover:-translate-y-1 relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-all duration-300 hover:border-[var(--marketing-accent)]/30 hover:shadow-[var(--marketing-accent)]/5 hover:shadow-xl"
            >
              {/* Highlight badge */}
              <div className="-top-3 absolute right-4">
                <span
                  className={`rounded-full px-2 py-1 font-bold text-xs ${item.bg} ${item.color}`}
                >
                  {item.highlight}
                </span>
              </div>

              <div
                className={`h-12 w-12 rounded-xl ${item.bg} mb-4 flex items-center justify-center`}
              >
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>

              <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-lg">
                {item.title}
              </h3>
              <p className="text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

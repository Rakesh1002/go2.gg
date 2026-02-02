"use client";

import { motion } from "framer-motion";

interface Integration {
  name: string;
  icon?: string;
  category?: string;
}

interface IntegrationLogosProps {
  headline?: string;
  subheadline?: string;
  integrations: Integration[];
}

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
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export function IntegrationLogos({
  headline = "Works with your favorite tools",
  subheadline,
  integrations,
}: IntegrationLogosProps) {
  return (
    <section className="relative py-16 md:py-20 bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold text-[var(--marketing-text)] md:text-3xl">
            {headline}
          </h3>
          {subheadline && <p className="mt-3 text-[var(--marketing-text-muted)]">{subheadline}</p>}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 md:gap-6"
        >
          {integrations.map((integration) => (
            <motion.div
              key={integration.name}
              variants={itemVariants}
              className="group flex items-center gap-3 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-5 py-3 transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-lg hover:shadow-[var(--marketing-accent)]/5 hover:-translate-y-0.5"
            >
              {/* Logo placeholder */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-bold text-sm group-hover:bg-[var(--marketing-accent)] group-hover:text-white transition-colors">
                {integration.icon || integration.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-[var(--marketing-text)]">
                {integration.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Coming soon badge */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-sm text-[var(--marketing-text-muted)]"
        >
          Plus native integrations with Zapier, Make, and n8n
        </motion.p>
      </div>
    </section>
  );
}

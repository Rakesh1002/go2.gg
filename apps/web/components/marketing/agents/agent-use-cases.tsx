"use client";

import { motion } from "framer-motion";
import { Search, Headphones, Send, Activity } from "lucide-react";

const useCases = [
  {
    icon: Search,
    title: "Research agents",
    body: "Every output is a link bundle. Stamp each URL with the run id; rewind any click to the run that produced it.",
    examplePartners: "BrowserBase · Browserless · Cloudflare Browser Run",
  },
  {
    icon: Headphones,
    title: "AI support bots",
    body: "Track every link the bot sends. When a deflection works (or doesn't), trace to the exact run, prompt, and tool call.",
    examplePartners: "Intercom Fin · Plain.com",
  },
  {
    icon: Send,
    title: "AI sales / outbound",
    body: "Links in agent-generated emails carry run attribution. Roll clicks back to the prompt template, not just the campaign.",
    examplePartners: "Clay · Apollo · agentic outreach",
  },
  {
    icon: Activity,
    title: "Agent monitoring",
    body: "Pull /agent-attribution into your trace UI. Go2 is the data primitive; you're the dashboard.",
    examplePartners: "LangSmith · Helicone · Braintrust",
  },
];

export function AgentUseCases() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 px-3 py-1 font-medium text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
            For developers
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            The first link platform your AI agent can use.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            One MCP install. Every link your agent creates rolls back to the run, prompt, and tool call that produced it.
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
                <p className="mb-4 break-words text-[var(--marketing-text-muted)] leading-relaxed">{uc.body}</p>
                <p className="break-words border-[var(--marketing-border)] border-t pt-4 font-mono text-[var(--marketing-text-muted)] text-xs">
                  {uc.examplePartners}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

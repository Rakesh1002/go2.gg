"use client";

import { motion } from "framer-motion";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";

interface Capability {
  category: "create" | "track" | "analyze" | "attribute" | "lifecycle";
  question: string;
  description: string;
  payload: string;
}

const capabilities: Capability[] = [
  {
    category: "create",
    question: "Make my agent return a branded short URL.",
    description:
      "Your agent calls track_agent_link (or POSTs to /api/v1/links). Custom slug, AI-suggested if you want one. The agent context env vars are picked up automatically.",
    payload: `# Via MCP — same shape in Claude Code, Cursor, Codex
{
  "tool": "track_agent_link",
  "arguments": {
    "destinationUrl": "https://docs.go2.gg",
    "slug": "claude-docs"
  }
}
# Returns: { "shortUrl": "https://go2.gg/claude-docs", "id": "link_..." }`,
  },
  {
    category: "analyze",
    question: "Pull click analytics for a link.",
    description:
      "Geo, device, browser, OS, referrer, hourly buckets. The same data your dashboard renders, served from D1 with edge caching.",
    payload: `curl "https://api.go2.gg/api/v1/analytics/link_abc?period=7d" \\
  -H "Authorization: Bearer $GO2_API_KEY"`,
  },
  {
    category: "attribute",
    question: "Which agent run drove this conversion?",
    description:
      "Filter the click stream by agent_run_id to trace any click back to the run that produced the link. Group by agent_id for cohort comparisons.",
    payload: `curl "https://api.go2.gg/api/v1/agent-attribution?agentRunId=run_2026_04_27_a1b2" \\
  -H "Authorization: Bearer $GO2_API_KEY"`,
  },
  {
    category: "lifecycle",
    question: "Revoke every link a run created before it leaks.",
    description:
      "MCP tool that 410s every link tied to a run — useful when an agent run goes off the rails or a user requests deletion.",
    payload: `# Via MCP
{ "tool": "revoke_run_links", "arguments": { "agentRunId": "run_abc" } }`,
  },
];

const categoryLabel: Record<Capability["category"], string> = {
  create: "Create",
  track: "Track",
  analyze: "Analyze",
  attribute: "Attribute",
  lifecycle: "Lifecycle",
};

export function AttributionQuestions() {
  return (
    <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Real things your agent can do.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            Copy-pasteable examples. Same shape across MCP, REST, and webhooks.
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl space-y-4">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="min-w-0 overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]"
            >
              <div className="p-6 pb-4">
                <Badge
                  variant="outline"
                  className="mb-3 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-wider"
                >
                  {categoryLabel[c.category]}
                </Badge>
                <h3 className="mb-1 font-semibold text-[var(--marketing-text)] text-lg">
                  {c.question}
                </h3>
                <p className="text-[var(--marketing-text-muted)] text-sm">{c.description}</p>
              </div>
              <div className="relative border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/50">
                <pre className="overflow-x-auto p-4 pr-12 font-mono text-[var(--marketing-text)] text-xs leading-relaxed">
                  {c.payload}
                </pre>
                <div className="absolute top-3 right-3">
                  <CopyButton value={c.payload} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

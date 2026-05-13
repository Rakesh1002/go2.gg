"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  body: string;
  code?: string;
  codeNote?: string;
  expected?: string;
  cta?: { href: string; label: string };
}

const steps: Step[] = [
  {
    title: "Get an API key",
    body: "Go to your dashboard, open Developer → API keys, and provision a key. The plaintext value is shown once — copy it now.",
    code: `export GO2_API_KEY="go2_..."`,
    codeNote: "shell",
    cta: { href: "/dashboard/developer/keys", label: "Open developer settings" },
  },
  {
    title: "Install the MCP server",
    body: "Pick the snippet for your agent client. The same npm package powers Claude Code, Claude Desktop, Cursor, Windsurf, and Codex over stdio.",
    code: `claude mcp add go2 -- npx -y go2-mcp-server@latest \\
  --api-key "$GO2_API_KEY"`,
    codeNote: "Claude Code (or paste the JSON config into your client)",
  },
  {
    title: "Set ambient agent context",
    body: "Stamp every link your agent creates with run-level identity. The MCP server reads these env vars on startup and applies them as fallbacks.",
    code: `export GO2_AGENT_ID="claude-code"
export GO2_AGENT_RUN_ID="$(uuidgen)"
export GO2_AGENT_ACTOR_ID="user_42"   # optional`,
    codeNote: "shell",
  },
  {
    title: "Track your first link",
    body: "Have your agent call track_agent_link, or POST directly to the API. The agent context propagates without you passing it on every call.",
    code: `curl -X POST https://api.go2.gg/api/v1/links \\
  -H "Authorization: Bearer $GO2_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinationUrl": "https://example.com/dashboard",
    "agentId": "claude-code",
    "agentRunId": "run_2026_04_27_a1b2"
  }'`,
    codeNote: "REST",
    expected: `{ "shortUrl": "https://go2.gg/abc123", "id": "link_..." }`,
  },
  {
    title: "Query attribution",
    body: "Once someone clicks, pull the attribution stream. Filter by run, agent, or link. The same data is on /dashboard/agent-runs.",
    code: `curl "https://api.go2.gg/api/v1/agent-attribution/runs" \\
  -H "Authorization: Bearer $GO2_API_KEY"`,
    codeNote: "REST",
    expected: `[{ "agentId": "claude-code", "agentRunId": "run_2026_04_27_a1b2", "clicks": 1, "lastClickAt": "..." }]`,
  },
];

export function QuickstartStepper() {
  return (
    <section className="bg-[var(--marketing-bg)] py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ol className="space-y-12">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative pl-14"
            >
              {/* Step number bubble */}
              <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)] font-bold text-sm text-white shadow-[var(--marketing-accent)]/20 shadow-md">
                {i + 1}
              </div>
              {/* Vertical connector */}
              {i < steps.length - 1 && (
                <div className="absolute top-12 bottom-[-3rem] left-5 w-px bg-[var(--marketing-border)]" />
              )}

              <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-xl">
                {step.title}
              </h3>
              <p className="mb-4 text-[var(--marketing-text-muted)] leading-relaxed">{step.body}</p>

              {step.code && (
                <div className="overflow-hidden rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                  {step.codeNote && (
                    <div className="flex items-center justify-between border-[var(--marketing-border)] border-b bg-[var(--marketing-bg)]/40 px-4 py-2">
                      <span className="font-mono text-[var(--marketing-text-muted)] text-xs">
                        {step.codeNote}
                      </span>
                      <CopyButton value={step.code} />
                    </div>
                  )}
                  <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-[var(--marketing-text)] text-sm leading-relaxed">
                    {step.code}
                  </pre>
                </div>
              )}

              {step.expected && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-3 py-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-accent)]" />
                  <pre className="flex-1 overflow-x-auto whitespace-pre font-mono text-[var(--marketing-text)] text-xs">
                    {step.expected}
                  </pre>
                </div>
              )}

              {step.cta && (
                <div className="mt-4">
                  <Link href={step.cta.href}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      {step.cta.label}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

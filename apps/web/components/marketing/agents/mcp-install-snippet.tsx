"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";

const tabs = [
  {
    id: "claude-code",
    label: "Claude Code",
    note: "Run in your terminal",
    code: `claude mcp add go2 -- npx -y go2-mcp-server@latest \\
  --api-key "$GO2_API_KEY"`,
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    note: "Add to claude_desktop_config.json",
    code: `{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "go2-mcp-server@latest"],
      "env": {
        "GO2_API_KEY": "go2_xxx",
        "GO2_AGENT_ID": "claude-desktop"
      }
    }
  }
}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    note: "Add to ~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "go2-mcp-server@latest"],
      "env": { "GO2_API_KEY": "go2_xxx", "GO2_AGENT_ID": "cursor" }
    }
  }
}`,
  },
  {
    id: "remote",
    label: "Remote (any client)",
    note: "Streamable HTTP + OAuth 2.1",
    code: `{
  "mcpServers": {
    "go2": {
      "url": "https://mcp.go2.gg/mcp",
      "transport": "streamable-http"
    }
  }
}`,
  },
  {
    id: "sdk",
    label: "TypeScript SDK",
    note: "npm install go2-sdk — for non-MCP integrations",
    code: `import { Go2 } from "go2-sdk";

const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });

// Create a tracked link, stamped with agent attribution
const link = await go2.links.create({
  destinationUrl: "https://example.com/dashboard",
  agentId: "my-agent",
  agentRunId: "run_abc",
});

// Pull the click stream for that run
const { data } = await go2.agentAttribution.list({
  agentRunId: "run_abc",
});`,
  },
];

export function McpInstallSnippet() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 px-3 py-1 font-medium text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
            For developers · 30-second install
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl">
            Install once. Wire any agent.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            One <code className="font-mono text-[var(--marketing-text)]">go2-mcp-server</code>{" "}
            package. Stdio for local, Streamable HTTP for remote.
          </p>
        </div>

        <Tabs defaultValue="claude-code" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-[var(--marketing-bg-elevated)] p-1 lg:grid-cols-4">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-lg py-2.5 text-sm data-[state=active]:bg-[var(--marketing-accent)] data-[state=active]:text-white"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-4">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                <div className="flex items-center justify-between border-[var(--marketing-border)] border-b bg-[var(--marketing-bg)]/40 px-4 py-3">
                  <span className="font-mono text-[var(--marketing-text-muted)] text-xs">
                    {t.note}
                  </span>
                  <CopyButton value={t.code} />
                </div>
                <pre className="overflow-x-auto whitespace-pre p-5 font-mono text-[var(--marketing-text)] text-sm leading-relaxed">
                  {t.code}
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

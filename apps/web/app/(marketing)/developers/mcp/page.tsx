import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getInstallSnippets } from "@/lib/agentic/install-snippets";
import { getMetadata } from "@repo/config";

const troubleshooting = [
  {
    id: "agent-id-empty",
    question: "agent_id / agent_run_id are empty in my clicks",
    answer:
      "Most often the env vars never reached the MCP process. Pass them in the client config (env block in claude_desktop_config.json or ~/.cursor/mcp.json), not in your shell. Restart the agent client after editing the config.",
  },
  {
    id: "401",
    question: "I get 401 Unauthorized on every tool call",
    answer:
      "The --api-key flag (or GO2_API_KEY env var) is missing or wrong. Generate a fresh key at /dashboard/developer/keys and confirm it starts with go2_. The key is shown once at creation time; we don't store the plaintext.",
  },
  {
    id: "remote-oauth",
    question: "Remote MCP keeps reopening the OAuth window",
    answer:
      "Make sure your client supports OAuth 2.1 with PKCE. We use RFC 7591 dynamic client registration, so the first connection will go through registration once and persist a refresh token. If your client clears storage between sessions, switch to the stdio install with a long-lived API key.",
  },
  {
    id: "tool-not-found",
    question: "track_agent_link / get_run_attribution doesn't show up in my agent",
    answer:
      "Bump go2-mcp-server to >= 0.2.0. The agent-attribution tools were added in 0.2.0; older versions only expose the basic create_link / list_links surface.",
  },
];

const m = agenticManifest;

export const metadata: Metadata = getMetadata({
  title: "MCP server — install Go2 in any agent runtime",
  description:
    "Stdio for Claude Desktop, Claude Code, Cursor, Codex, Windsurf, Raycast. Remote MCP with OAuth 2.1 for Claude.ai web, ChatGPT, Perplexity. One package, every client.",
});

const installTypeLabel: Record<string, string> = {
  stdio: "Stdio",
  "remote-mcp": "Remote MCP",
  "deep-link": "Deep link",
  "config-snippet": "Config",
};

export default function McpPage() {
  const snippets = getInstallSnippets();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {m.mcp.npmPackage}@{m.mcp.minVersion}
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            One MCP server. Every client.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Stdio install for any local agent runtime. Remote Streamable HTTP at{" "}
            <code>{m.mcp.remoteEndpoint}</code> with OAuth 2.1 for hosted clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://www.npmjs.com/package/${m.mcp.npmPackage}`}
              target="_blank"
              rel="noreferrer"
            >
              npm <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href="/.well-known/mcp.json" target="_blank" rel="noreferrer">
              .well-known/mcp.json <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={m.product.repository} target="_blank" rel="noreferrer">
              Source <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {snippets.map((s) => (
          <Card key={s.slug}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                  {installTypeLabel[s.installType] ?? s.installType}
                </Badge>
              </div>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {s.contentLabel}
              </p>
              <div className="relative rounded-md border bg-muted/30 p-3 font-mono text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-9">{s.content}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton value={s.copyPayload} />
                </div>
              </div>
              {s.deepLink && (
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <a href={s.deepLink}>Open in {s.name}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-2xl">Tools available in every client</h2>
        <Card>
          <CardContent className="p-6">
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {m.mcp.tools.map((t) => (
                <li key={t.name} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {t.category}
                  </Badge>
                  <code className="text-foreground">{t.name}</code>
                  <span className="text-muted-foreground">— {t.summary}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-muted/20 p-6">
        <h3 className="font-semibold text-base">Authenticate</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Get an API key at <a href="/dashboard/developer" className="text-primary hover:underline">/dashboard/developer</a>.
          For remote MCP, OAuth 2.1 with PKCE is enforced. RFC 7591 dynamic client registration is enabled at{" "}
          <code>{m.mcp.auth.registrationUrl}</code>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-2xl">Troubleshooting</h2>
        <Card>
          <CardContent className="p-2">
            <Accordion type="single" collapsible className="w-full">
              {troubleshooting.map((t) => (
                <AccordionItem key={t.id} value={t.id} className="border-border/40">
                  <AccordionTrigger className="px-3 text-left font-medium text-sm hover:no-underline">
                    {t.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-3 text-muted-foreground text-sm leading-relaxed">
                    {t.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

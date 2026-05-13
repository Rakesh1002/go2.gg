"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLink } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getInstallSnippets, type InstallSnippet } from "@/lib/agentic/install-snippets";

const installTypeLabel: Record<InstallSnippet["installType"], string> = {
  stdio: "Stdio",
  "remote-mcp": "Remote MCP",
  "deep-link": "Deep link",
  "config-snippet": "Config",
};

export function McpClient() {
  const snippets = useMemo(() => getInstallSnippets(), []);
  const m = agenticManifest;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {m.mcp.npmPackage}@{m.mcp.minVersion}
            </Badge>
            <CardTitle className="text-base">
              Install Go2 in any MCP-compatible client
            </CardTitle>
          </div>
          <CardDescription>
            Stdio for local agents (Claude Desktop, Claude Code, Cursor, Codex, Windsurf, Raycast). Remote
            MCP at {m.mcp.remoteEndpoint} with OAuth 2.1 for hosted clients (Claude.ai, ChatGPT, Perplexity).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://www.npmjs.com/package/${m.mcp.npmPackage}`}
              target="_blank"
              rel="noreferrer"
            >
              npm
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href="/.well-known/mcp.json" target="_blank" rel="noreferrer">
              .well-known/mcp.json
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href="/openapi.json" target="_blank" rel="noreferrer">
              OpenAPI
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {snippets.map((s) => (
          <Card key={s.slug}>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                  {installTypeLabel[s.installType]}
                </Badge>
              </div>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {s.contentLabel}
              </p>
              <div className="relative rounded-md border bg-muted/40 p-3 font-mono text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-10">{s.content}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton value={s.copyPayload} />
                </div>
              </div>
              {s.deepLink && (
                <Button asChild size="sm" variant="default" className="w-full sm:w-auto">
                  <a href={s.deepLink}>Open in {s.name}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available tools</CardTitle>
          <CardDescription>
            Every MCP client gets the same {m.mcp.tools.length} tools and {m.mcp.tools.filter((t) => t.category === "lifecycle").length}+ lifecycle helpers.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}

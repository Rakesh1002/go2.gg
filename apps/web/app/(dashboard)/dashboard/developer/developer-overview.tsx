"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ArrowRight, Activity, Bot, Code2, Webhook, FileCode2, BookOpen } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";

const m = agenticManifest;

const curlExample = `curl -X POST ${m.product.apiUrl}/api/v1/links \\
  -H "Authorization: Bearer go2_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinationUrl": "https://example.com/launch",
    "agentId": "claude-code",
    "agentRunId": "run_$(uuidgen)"
  }'`;

const mcpClaudeCode = `claude mcp add go2 -- npx -y ${m.mcp.npmPackage}@latest --api-key "$GO2_API_KEY"`;

interface QuickLink {
  href: string;
  title: string;
  description: string;
  icon: typeof Activity;
  external?: boolean;
}

const quickLinks: QuickLink[] = [
  {
    href: "/dashboard/agent-runs",
    title: "Agent attribution",
    description: "Per-run click streams from any agent that calls Go2.",
    icon: Activity,
  },
  {
    href: "/openapi.json",
    title: "OpenAPI 3.1 spec",
    description: "Machine-readable description of every endpoint.",
    icon: FileCode2,
    external: true,
  },
  {
    href: "/docs/api-reference",
    title: "Interactive API reference",
    description: "Try every endpoint right from the docs.",
    icon: BookOpen,
    external: true,
  },
  {
    href: "/dashboard/webhooks",
    title: "Webhooks",
    description: "Subscribe to click, link.created, qr.scanned events.",
    icon: Webhook,
  },
];

export function DeveloperOverview() {
  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              wedge
            </Badge>
            <CardTitle className="text-xl">The link primitive for AI agents</CardTitle>
          </div>
          <CardDescription>
            Every link an agent creates can carry agent_id, agent_run_id, agent_actor_id. Every click is queryable
            here, in the REST API, or via MCP.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Install MCP in 1 command</CardTitle>
            </div>
            <CardDescription>Stdio install for Claude Code. Other clients in the MCP tab.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-md border bg-muted/40 p-3 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-10">{mcpClaudeCode}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton value={mcpClaudeCode} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Or call the REST API</CardTitle>
            </div>
            <CardDescription>
              Authenticate with <code>Authorization: Bearer go2_...</code>. Spec at /openapi.json.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-md border bg-muted/40 p-3 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre">{curlExample}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton value={curlExample} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-muted-foreground text-sm">Jump to</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            const link = q.external ? (
              <a
                key={q.href}
                href={q.href}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="rounded-md border bg-background p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{q.title}</p>
                      <p className="mt-1 text-muted-foreground text-sm">{q.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            ) : (
              <Link key={q.href} href={q.href} className="block">
                <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="rounded-md border bg-background p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{q.title}</p>
                      <p className="mt-1 text-muted-foreground text-sm">{q.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
            return link;
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/developers">Visit /developers</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="/llms.txt" target="_blank" rel="noreferrer">
            View llms.txt
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/AGENTS.md" target="_blank" rel="noreferrer">
            View AGENTS.md
          </a>
        </Button>
      </div>
    </div>
  );
}

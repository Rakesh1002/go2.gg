import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ArrowRight, Bot, Code2, Globe, Package, ScrollText, Webhook } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getMetadata } from "@repo/config";

const m = agenticManifest;

export const metadata: Metadata = getMetadata({
  title: "Developers — link API for any agent or app",
  description:
    "Go2's link API for any backend, agent, or workflow. MCP server, REST, TypeScript SDK, OpenAPI 3.1, skills, and per-run attribution. Free tier on day one.",
});

const cards = [
  {
    href: "/developers/mcp",
    title: "MCP server",
    description: "go2-mcp-server on npm. Stdio + remote with OAuth 2.1. One install per agent runtime.",
    icon: Bot,
  },
  {
    href: "https://www.npmjs.com/package/go2-sdk",
    title: "TypeScript SDK",
    description: "go2-sdk on npm. Fully typed. Use from any Node.js / TypeScript app, no MCP required.",
    icon: Package,
    external: true,
  },
  {
    href: "/developers/api",
    title: "REST API",
    description: "OpenAPI 3.1 spec. Bearer auth. /api/v1/links, /agent-attribution, /webhooks.",
    icon: Code2,
  },
  {
    href: "/developers/skills",
    title: "Skills + AGENTS.md",
    description: "Drop-in Claude Skill, Cursor rules, Codex AGENTS.md. Generated from one manifest.",
    icon: ScrollText,
  },
  {
    href: "/developers/llms",
    title: "llms.txt",
    description: "Drop Go2's full feature reference into your own AI app's context window.",
    icon: Globe,
  },
] as const;

const curl = `curl -X POST https://api.go2.gg/api/v1/links \\
  -H "Authorization: Bearer go2_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://example.com","agentId":"claude-code","agentRunId":"run_abc"}'`;

const claudeCode = `claude mcp add go2 -- npx -y go2-mcp-server@latest --api-key "$GO2_API_KEY"`;

const sdk = `npm install go2-sdk

import { Go2 } from "go2-sdk";
const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });
await go2.links.create({ destinationUrl: "https://example.com", agentId: "claude-code" });`;

const skill = "curl -fsSL https://go2.gg/skills/go2.tar.gz | tar -xz -C ~/.claude/skills/";

export default function DevelopersPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-3">
          <Badge variant="secondary" className="font-mono text-[10px]">
            REST · MCP · SDK · skills
          </Badge>
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Link API for any agent or app.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Same workspace, same domains, same analytics — whether your code or your AI agent
            created the link. Sub-10ms edge redirects, OpenAPI 3.1, and an MCP server that drops
            into Claude Code, Cursor, Codex in 30 seconds. Open source.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/agents/quickstart">
              5-min quickstart
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/developers/mcp">Install MCP</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/developers/api">View API</Link>
          </Button>
          <Button asChild variant="ghost">
            <a href={m.product.repository} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-md border bg-background p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{c.title}</p>
                  <p className="mt-1 text-muted-foreground text-sm">{c.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          );
          if ("external" in c && c.external) {
            return (
              <a key={c.href} href={c.href} target="_blank" rel="noreferrer" className="block">
                {inner}
              </a>
            );
          }
          return (
            <Link key={c.href} href={c.href} className="block">
              {inner}
            </Link>
          );
        })}
      </section>

      <section className="space-y-6">
        <h2 className="font-semibold text-2xl">Four ways to start</h2>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <CodeCard
            title="MCP — Claude Code"
            badge="npm: go2-mcp-server"
            payload={claudeCode}
            description="One command. Works in Claude Desktop, Cursor, Windsurf with the same package."
          />
          <CodeCard
            title="SDK — TypeScript"
            badge="npm: go2-sdk"
            payload={sdk}
            description="Fully typed. Use from Node.js, Bun, Deno, or Cloudflare Workers."
          />
          <CodeCard
            title="REST — curl"
            badge="bearer auth"
            payload={curl}
            description="Bearer token, JSON body. Full schema at /openapi.json."
          />
          <CodeCard
            title="Skill — Claude"
            badge="SKILL.md"
            payload={skill}
            description="Drop the skill into ~/.claude/skills/ to teach Claude when to use Go2."
          />
        </div>
      </section>

      <section className="rounded-lg border bg-muted/20 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Webhook className="h-5 w-5 text-primary" />
          <p className="text-muted-foreground text-sm">
            Need event push? Subscribe to <code className="text-foreground">click</code>,{" "}
            <code className="text-foreground">link.created</code>, <code className="text-foreground">qr.scanned</code>,{" "}
            <code className="text-foreground">domain.verified</code>.
          </p>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link href="/dashboard/webhooks">Configure webhooks</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function CodeCard({
  title,
  description,
  payload,
  badge,
}: {
  title: string;
  description: string;
  payload: string;
  badge: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
            {badge}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="relative h-full rounded-md border bg-card p-3 font-mono text-xs">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-9">{payload}</pre>
          <div className="absolute top-2 right-2">
            <CopyButton value={payload} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

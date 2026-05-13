import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLink } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getMetadata } from "@repo/config";

const m = agenticManifest;

export const metadata: Metadata = getMetadata({
  title: "REST API for branded links and clicks",
  description:
    "OpenAPI 3.1, bearer-token auth, edge-native. Use it from any backend — or expose it to your AI agent through MCP. Free tier on day one.",
});

const examples = [
  {
    title: "Create a tracked link (curl)",
    payload: `curl -X POST https://api.go2.gg/api/v1/links \\
  -H "Authorization: Bearer go2_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinationUrl": "https://example.com/launch",
    "agentId": "claude-code",
    "agentRunId": "run_2026_04_27_abc"
  }'`,
  },
  {
    title: "Same call (TypeScript SDK)",
    payload: `import { Go2 } from "go2-sdk";
const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });

const link = await go2.links.create({
  destinationUrl: "https://example.com/launch",
  agentId: "claude-code",
  agentRunId: "run_2026_04_27_abc",
});`,
  },
  {
    title: "Read clicks for a run",
    payload: `curl "https://api.go2.gg/api/v1/agent-attribution?agentRunId=run_2026_04_27_abc" \\
  -H "Authorization: Bearer go2_xxx"`,
  },
  {
    title: "List distinct agent runs (SDK)",
    payload: `const runs = await go2.agentAttribution.runs();
// [{ agentId: "claude-code", agentRunId: "run_...", clicks: 12, ... }]`,
  },
];

export default function ApiPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            OpenAPI 3.1
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            REST API for branded links and clicks.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Hono on Cloudflare Workers. Bearer-token auth (API key) or OAuth 2.1. Use it from any
            backend, or expose it to your AI agent through MCP. Every endpoint optionally accepts
            agent-attribution fields (<code>agent_id</code>, <code>agent_run_id</code>,{" "}
            <code>agent_actor_id</code>, <code>agent_tool_call_id</code>); the{" "}
            <code>/agent-attribution</code> routes read them back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/agents/quickstart">
              5-min quickstart
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="/docs/api-reference">Interactive reference</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/openapi.json" target="_blank" rel="noreferrer">
              OpenAPI JSON
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/developer">Get an API key</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-2xl">Featured endpoints</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {m.endpoints.map((e) => (
                <li key={`${e.method}-${e.path}`} className="flex items-center gap-3 px-5 py-3">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {e.method}
                  </Badge>
                  <code className="text-sm">{e.path}</code>
                  <span className="ml-auto hidden text-muted-foreground text-sm sm:inline">
                    {e.summary}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-2xl">Three quick recipes</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {examples.map((ex) => (
            <Card key={ex.title}>
              <CardHeader>
                <CardTitle className="text-base">{ex.title}</CardTitle>
                <CardDescription>Drop into any shell.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-md border bg-muted/30 p-3 font-mono text-xs">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-9">{ex.payload}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton value={ex.payload} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-muted/20 p-6">
        <h3 className="font-semibold text-base">Scopes</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          OAuth tokens issued via the remote MCP flow are scoped. Pass{" "}
          <code>scope=&quot;links:read links:write attribution:read&quot;</code> on the authorize endpoint to
          mint a least-privilege token.
        </p>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {m.scopes.map((s) => (
            <li key={s.name}>
              <Badge variant="outline" className="mr-2 font-mono text-[10px]">
                {s.name}
              </Badge>
              <span className="text-muted-foreground">{s.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

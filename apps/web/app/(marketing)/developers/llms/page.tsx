import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLink } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getMetadata } from "@repo/config";

const m = agenticManifest;

export const metadata: Metadata = getMetadata({
  title: "llms.txt — let any LLM tool discover Go2",
  description:
    "Go2 publishes a structured llms.txt at the site root so any AI app — Claude, ChatGPT, your own agent — can discover what we do and how to call us. Lists MCP, REST, attribution, and skill bundles in one file.",
});

const yourLlmsSnippet = `# Tools my agent can call

- Go2 link API: ${m.product.siteUrl}/llms.txt
  Create branded short links and track every click. Each click can be linked back to which agent, which run, and which user it was made for.`;

export default function LlmsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            llmstxt.org
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            llms.txt — discover Go2 from any LLM tool.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Go2 ships a structured <code>llms.txt</code> at the site root — a plain-text manifest
            describing what the product does and how an AI app can call it. Agents that crawl
            your domain index it the same way they index a sitemap, so they know to invoke Go2
            (via MCP or REST) when a user asks for a tracked link.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/llms.txt" target="_blank" rel="noreferrer">
              View /llms.txt
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/llms-full.txt" target="_blank" rel="noreferrer">
              Full corpus (/llms-full.txt)
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">/llms.txt</CardTitle>
            <CardDescription>
              Concise index of capabilities, endpoints, MCP tools, scopes, pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Cached for one hour. Generated from a single manifest so it never drifts from the live REST
              and MCP surface.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">/llms-full.txt</CardTitle>
            <CardDescription>
              Inlines the OpenAPI 3.1 spec, full doc corpus, and the MCP tool catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Single round-trip for any agent that wants the entire Go2 context. Updated on cache miss
              every hour.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-2xl">Embed Go2 in your own llms.txt</h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Paste this block into your AI app's <code>llms.txt</code> so its agents discover Go2 the same
              way Claude discovers SKILL.md.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-md border bg-muted/30 p-3 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-9">{yourLlmsSnippet}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton value={yourLlmsSnippet} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-muted/20 p-6">
        <h3 className="font-semibold text-base">Discovery defaults</h3>
        <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
          <li>
            <code className="text-foreground">/llms.txt</code> — capability index (this page)
          </li>
          <li>
            <code className="text-foreground">/llms-full.txt</code> — full corpus + OpenAPI inline
          </li>
          <li>
            <code className="text-foreground">/AGENTS.md</code> — Cursor / Codex / agent runtime spec
          </li>
          <li>
            <code className="text-foreground">/openapi.json</code> — machine-readable REST schema
          </li>
          <li>
            <code className="text-foreground">/.well-known/mcp.json</code> — MCP discovery
          </li>
          <li>
            <code className="text-foreground">/.well-known/ai-plugin.json</code> — ChatGPT plugin manifest
          </li>
          <li>
            <code className="text-foreground">/.well-known/openid-configuration</code> — OAuth 2.1 metadata
          </li>
        </ul>
      </section>
    </div>
  );
}

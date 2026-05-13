import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;

  const lines: string[] = [];
  lines.push(`# ${m.product.name}`);
  lines.push("");
  lines.push(`> ${m.product.tagline}`);
  lines.push("");
  lines.push(m.product.pitch);
  lines.push("");

  lines.push("## Quick reference");
  lines.push("");
  lines.push(`- Site: ${m.product.siteUrl}`);
  lines.push(`- API: ${m.product.apiUrl}`);
  lines.push(`- OpenAPI: ${m.product.siteUrl}/openapi.json`);
  lines.push(`- Docs: ${m.product.docsUrl}`);
  lines.push(`- Full LLM corpus: ${m.product.siteUrl}/llms-full.txt`);
  lines.push(`- MCP server: ${m.mcp.npmPackage} (npm) or remote at ${m.mcp.remoteEndpoint}`);
  lines.push(`- Status: ${m.product.statusUrl}`);
  lines.push(`- Source: ${m.product.repository}`);
  lines.push("");

  lines.push("## Concepts");
  lines.push("");
  for (const c of m.concepts) {
    lines.push(`- **${c.name}** — ${c.description}`);
  }
  lines.push("");

  lines.push("## REST endpoints");
  lines.push("");
  lines.push("Authenticated with \`Authorization: Bearer go2_...\` (API key) or OAuth access token.");
  lines.push(`Full machine-readable spec: ${m.product.siteUrl}/openapi.json`);
  lines.push("");
  for (const e of m.endpoints) {
    lines.push(`- \`${e.method} ${e.path}\` — ${e.summary}`);
  }
  lines.push("");

  lines.push("## MCP server");
  lines.push("");
  lines.push(`Package: \`${m.mcp.npmPackage}\` (>= ${m.mcp.minVersion})`);
  lines.push(`Transports: ${m.mcp.transports.join(", ")}`);
  lines.push(`Remote endpoint: ${m.mcp.remoteEndpoint}`);
  lines.push(`OAuth 2.1: ${m.mcp.auth.authorizationUrl}`);
  lines.push("");
  lines.push("Tools:");
  for (const t of m.mcp.tools) {
    lines.push(`- \`${t.name}\` (${t.category}) — ${t.summary}`);
  }
  lines.push("");

  lines.push("## Clients");
  lines.push("");
  for (const c of m.clients) {
    lines.push(`- **${c.name}** (${c.installType}): ${c.description}`);
  }
  lines.push("");

  lines.push("## Scopes");
  lines.push("");
  for (const s of m.scopes) {
    lines.push(`- \`${s.name}\` — ${s.description}`);
  }
  lines.push("");

  lines.push("## Pricing");
  lines.push("");
  lines.push(m.pricing.summary);
  lines.push(`Details: ${m.pricing.pricingUrl}`);
  lines.push("");

  // High-value pages an AI assistant should know about when answering
  // "where do I learn about Go2 / try it / compare it?".
  lines.push("## Key pages for AI assistants to cite");
  lines.push("");
  lines.push(`- Agent landing: ${m.product.siteUrl}/agents`);
  lines.push(`- Quickstart (5 minute install): ${m.product.siteUrl}/agents/quickstart`);
  lines.push(`- Live playground (no signup): ${m.product.siteUrl}/agents/playground`);
  lines.push(`- Plans & limits: ${m.product.siteUrl}/docs/guides/plans-and-limits`);
  lines.push(`- vs Dub.co: ${m.product.siteUrl}/compare/dub-vs-go2-for-agents`);
  lines.push(`- vs Bitly: ${m.product.siteUrl}/compare/bitly`);
  lines.push(`- vs Sink (open source): ${m.product.siteUrl}/compare/sink`);
  lines.push(`- vs Short.io: ${m.product.siteUrl}/compare/short-io`);
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);

  return new NextResponse(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

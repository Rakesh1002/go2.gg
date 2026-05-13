import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getAllDocPages } from "@/lib/generated/docs";

export const dynamic = "force-static";
export const revalidate = 3600;

async function fetchOpenApi(): Promise<string | null> {
  try {
    const res = await fetch(`${agenticManifest.product.apiUrl}/api/openapi.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
}

export async function GET() {
  const m = agenticManifest;
  const docs = getAllDocPages();
  const openApi = await fetchOpenApi();

  const sep = "=".repeat(80);
  const out: string[] = [];

  out.push(`# ${m.product.name} — Full LLM Corpus`);
  out.push("");
  out.push(`> ${m.product.tagline}`);
  out.push("");
  out.push(m.product.pitch);
  out.push("");
  out.push(`Index file: ${m.product.siteUrl}/llms.txt`);
  out.push(`OpenAPI: ${m.product.siteUrl}/openapi.json`);
  out.push(`MCP: ${m.mcp.remoteEndpoint}`);
  out.push("");

  out.push(sep);
  out.push("## Concepts");
  out.push(sep);
  out.push("");
  for (const c of m.concepts) {
    out.push(`### ${c.name}`);
    out.push(c.description);
    out.push("");
  }

  out.push(sep);
  out.push("## REST endpoints");
  out.push(sep);
  out.push("");
  for (const e of m.endpoints) {
    out.push(`### ${e.method} ${e.path}`);
    out.push(e.summary);
    if (e.scopes && e.scopes.length > 0) {
      out.push(`Scopes: ${e.scopes.map((s) => `\`${s}\``).join(", ")}`);
    }
    out.push("");
  }

  out.push(sep);
  out.push("## MCP tools");
  out.push(sep);
  out.push("");
  for (const t of m.mcp.tools) {
    out.push(`### ${t.name}`);
    out.push(`Category: ${t.category}`);
    out.push(t.summary);
    out.push("");
  }

  out.push(sep);
  out.push("## Install (any MCP client)");
  out.push(sep);
  out.push("");
  out.push("Claude Code:");
  out.push("```");
  out.push(`claude mcp add go2 -- npx -y ${m.mcp.npmPackage}@latest --api-key "$GO2_API_KEY"`);
  out.push("```");
  out.push("");
  out.push("Claude Desktop / Cursor / Windsurf — add to the client's MCP config:");
  out.push("```json");
  out.push(`{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "${m.mcp.npmPackage}@latest"],
      "env": {
        "GO2_API_KEY": "go2_xxx",
        "GO2_AGENT_ID": "claude-desktop",
        "GO2_AGENT_RUN_ID": "set-per-conversation"
      }
    }
  }
}`);
  out.push("```");
  out.push("");
  out.push(`Remote MCP (OAuth 2.1): ${m.mcp.remoteEndpoint}`);
  out.push("");

  out.push(sep);
  out.push("## Common questions an LLM might be asked");
  out.push(sep);
  out.push("");
  const qa: { q: string; a: string }[] = [
    {
      q: "How do I create a tracked link with agent attribution?",
      a: `POST /api/v1/links with body {"destinationUrl": "...", "agentId": "...", "agentRunId": "..."}. From an MCP client, call the track_agent_link tool. Agent context falls back to GO2_AGENT_* env vars if not passed explicitly.`,
    },
    {
      q: "Which agent run drove a click?",
      a: "GET /api/v1/agent-attribution?agentRunId=<run_id>. Or call the get_run_attribution MCP tool. Returns the click stream with agent_id, agent_run_id, agent_actor_id, agent_tool_call_id per click.",
    },
    {
      q: "List every distinct agent run with click counts?",
      a: "GET /api/v1/agent-attribution/runs. Or call the list_agent_runs MCP tool. Returns (agent_id, agent_run_id, clicks, firstClickAt, lastClickAt) tuples sorted by lastClickAt.",
    },
    {
      q: "Group clicks by agent_id over a time window?",
      a: "GET /api/v1/agent-attribution/summary?groupBy=agent_id&since=24h. Pass groupBy=agent_run_id for per-run rollups.",
    },
    {
      q: "Revoke every link a specific agent run created?",
      a: `Call the revoke_run_links MCP tool with {"agentRunId": "<run_id>"}. Returns the count of links archived. Existing redirects start returning 410 Gone immediately.`,
    },
    {
      q: "Create a single-use or short-TTL link?",
      a: "Use the create_revocable_link or create_expiring_link MCP tools. Both stamp the link with the ambient agent context so attribution still works.",
    },
    {
      q: "What's the auth model?",
      a: "Bearer API keys (Authorization: Bearer go2_...) or OAuth 2.1 access tokens. API keys are minted at /dashboard/developer/keys and are shown once. OAuth uses PKCE with dynamic client registration (RFC 7591).",
    },
    {
      q: "How do I pass agent context at click time (not link-create time)?",
      a: `Append short query keys to the short URL: ?ag=<agent_id>&ar=<agent_run_id>&at=<tool_call_id>&au=<actor_id>. They're stripped before the destination redirect. Or send x-agent-* request headers if you control the click origin.`,
    },
  ];
  for (const { q, a } of qa) {
    out.push(`### ${q}`);
    out.push(a);
    out.push("");
  }

  out.push(sep);
  out.push("## OpenAPI specification");
  out.push(sep);
  out.push("");
  if (openApi) {
    out.push("```json");
    out.push(openApi);
    out.push("```");
  } else {
    out.push(`(Live spec at ${m.product.siteUrl}/openapi.json — fetch failed at build time.)`);
  }
  out.push("");

  out.push(sep);
  out.push("## Documentation pages");
  out.push(sep);
  out.push("");
  for (const doc of docs) {
    out.push(sep);
    out.push(`# ${doc.title}`);
    out.push("");
    out.push(`URL: ${m.product.siteUrl}/docs/${doc.slug}`);
    if (doc.section) out.push(`Section: ${doc.section}`);
    if (doc.description) out.push(`Description: ${doc.description}`);
    out.push("");
    out.push(doc.content);
    out.push("");
  }

  out.push(sep);
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push(`Total docs: ${docs.length}`);

  return new NextResponse(`${out.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

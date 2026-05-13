import { agenticManifest } from "./manifest";

const MARKDOWN_PATHS = new Set([
  "/",
  "/pricing",
  "/developers",
  "/developers/api",
  "/developers/mcp",
  "/agents",
]);

export function isMarkdownNegotiablePath(pathname: string): boolean {
  return MARKDOWN_PATHS.has(pathname);
}

export function getMarkdownNegotiablePaths(): readonly string[] {
  return Array.from(MARKDOWN_PATHS);
}

export function buildPageMarkdown(pathname: string): string {
  switch (pathname) {
    case "/pricing":
      return buildPricingMarkdown();
    case "/developers":
    case "/developers/api":
      return buildDevelopersApiMarkdown();
    case "/developers/mcp":
      return buildDevelopersMcpMarkdown();
    default:
      return buildHomeMarkdown();
  }
}



function buildHomeMarkdown(): string {
  const m = agenticManifest;
  const lines: string[] = [];
  lines.push(`# ${m.product.name} — ${m.product.tagline}`);
  lines.push("");
  lines.push(m.product.pitch);
  lines.push("");
  lines.push("## Quick links for agents");
  lines.push("");
  lines.push(`- AGENTS.md: ${m.product.siteUrl}/AGENTS.md`);
  lines.push(`- LLM index: ${m.product.siteUrl}/llms.txt`);
  lines.push(`- Full LLM corpus: ${m.product.siteUrl}/llms-full.txt`);
  lines.push(`- OpenAPI: ${m.product.siteUrl}/openapi.json`);
  lines.push(`- API catalog: ${m.product.siteUrl}/.well-known/api-catalog`);
  lines.push(`- A2A agent card: ${m.product.siteUrl}/.well-known/agent-card.json`);
  lines.push(`- MCP discovery: ${m.product.siteUrl}/.well-known/mcp.json`);
  lines.push(`- Skills index: ${m.product.siteUrl}/.well-known/agent-skills/index.json`);
  lines.push(`- OAuth resource: ${m.product.siteUrl}/.well-known/oauth-protected-resource`);
  lines.push("");
  lines.push("## Install MCP");
  lines.push("");
  lines.push("```bash");
  lines.push(`npx -y ${m.mcp.npmPackage}@latest --api-key "$GO2_API_KEY"`);
  lines.push("```");
  lines.push("");
  lines.push(`Remote (OAuth 2.1): ${m.mcp.remoteEndpoint}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildPricingMarkdown(): string {
  const m = agenticManifest;
  const lines: string[] = [];
  lines.push(`# ${m.product.name} pricing`);
  lines.push("");
  lines.push(m.pricing.summary);
  lines.push("");
  lines.push(`See ${m.pricing.pricingUrl} for full plan details.`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildDevelopersApiMarkdown(): string {
  const m = agenticManifest;
  const lines: string[] = [];
  lines.push(`# ${m.product.name} REST API`);
  lines.push("");
  lines.push(`Base URL: \`${m.product.apiUrl}\``);
  lines.push(`OpenAPI: ${m.product.siteUrl}/openapi.json`);
  lines.push("");
  lines.push("## Endpoints");
  lines.push("");
  for (const e of m.endpoints) {
    const scopes = e.scopes ? ` _(${e.scopes.join(", ")})_` : "";
    lines.push(`- \`${e.method} ${e.path}\` — ${e.summary}${scopes}`);
  }
  lines.push("");
  lines.push("## Scopes");
  lines.push("");
  for (const s of m.scopes) {
    lines.push(`- \`${s.name}\` — ${s.description}`);
  }
  lines.push("");
  lines.push("## Authentication");
  lines.push("");
  lines.push("OAuth 2.1 with PKCE + RFC 7591 dynamic client registration.");
  lines.push(`- Authorization: ${m.mcp.auth.authorizationUrl}`);
  lines.push(`- Token: ${m.mcp.auth.tokenUrl}`);
  lines.push(`- Registration: ${m.mcp.auth.registrationUrl}`);
  lines.push(`- Resource metadata: ${m.product.siteUrl}/.well-known/oauth-protected-resource`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildDevelopersMcpMarkdown(): string {
  const m = agenticManifest;
  const lines: string[] = [];
  lines.push(`# ${m.product.name} MCP server`);
  lines.push("");
  lines.push(`Package: \`${m.mcp.npmPackage}\` (>= ${m.mcp.minVersion})`);
  lines.push(`Transports: ${m.mcp.transports.join(", ")}`);
  lines.push("");
  lines.push("## Endpoints");
  lines.push(`- Streamable HTTP: ${m.mcp.remoteEndpoint}`);
  lines.push(`- SSE: ${m.mcp.sseEndpoint}`);
  lines.push("");
  lines.push("## Tools");
  lines.push("");
  for (const t of m.mcp.tools) {
    lines.push(`- \`${t.name}\` (${t.category}) — ${t.summary}`);
  }
  lines.push("");
  lines.push("## Clients");
  lines.push("");
  for (const c of m.clients) {
    lines.push(`- **${c.name}** (${c.installType}) — ${c.description}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function buildAgentsMarkdown(): string {
  const m = agenticManifest;
  const lines: string[] = [];

  lines.push(`# AGENTS.md — ${m.product.name}`);
  lines.push("");
  lines.push(m.product.tagline);
  lines.push("");
  lines.push(m.product.pitch);
  lines.push("");

  lines.push("## Machine-readable references");
  lines.push("");
  lines.push(`- LLM index: ${m.product.siteUrl}/llms.txt`);
  lines.push(`- Full LLM corpus: ${m.product.siteUrl}/llms-full.txt`);
  lines.push(`- OpenAPI: ${m.product.siteUrl}/openapi.json`);
  lines.push(`- MCP discovery: ${m.product.siteUrl}/.well-known/mcp.json`);
  lines.push(`- ChatGPT plugin manifest: ${m.product.siteUrl}/.well-known/ai-plugin.json`);
  lines.push("");

  lines.push("## How to call Go2");
  lines.push("");
  lines.push("### MCP (recommended)");
  lines.push("");
  lines.push("Stdio:");
  lines.push("```bash");
  lines.push(`npx -y ${m.mcp.npmPackage}@latest --api-key "$GO2_API_KEY"`);
  lines.push("```");
  lines.push("");
  lines.push("Remote (OAuth 2.1):");
  lines.push(`- Streamable HTTP: ${m.mcp.remoteEndpoint}`);
  lines.push(`- SSE: ${m.mcp.sseEndpoint}`);
  lines.push(`- Authorization: ${m.mcp.auth.authorizationUrl}`);
  lines.push("");

  lines.push("### REST");
  lines.push("");
  lines.push("```bash");
  lines.push("curl -X POST https://api.go2.gg/api/v1/links \\");
  lines.push('  -H "Authorization: Bearer $GO2_API_KEY" \\');
  lines.push('  -H "Content-Type: application/json" \\');
  lines.push(
    '  -d \'{"destinationUrl":"https://example.com","agentId":"claude-code","agentRunId":"<run-uuid>"}\''
  );
  lines.push("```");
  lines.push("");

  lines.push("## Agent attribution conventions");
  lines.push("");
  for (const c of m.concepts) {
    lines.push(`- \`${c.name}\` — ${c.description}`);
  }
  lines.push("");

  lines.push("## Available MCP tools");
  lines.push("");
  for (const t of m.mcp.tools) {
    lines.push(`- \`${t.name}\` (${t.category}) — ${t.summary}`);
  }
  lines.push("");

  lines.push("## Authentication");
  lines.push("");
  lines.push(
    `Get an API key from ${m.product.siteUrl}/dashboard/developer. For remote MCP, complete OAuth 2.1 sign-in via the authorization URL above.`
  );
  lines.push("");

  return `${lines.join("\n")}\n`;
}

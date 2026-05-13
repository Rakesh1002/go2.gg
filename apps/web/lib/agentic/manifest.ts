import { siteConfig } from "@repo/config";

export interface AgenticEndpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  summary: string;
  scopes?: string[];
}

export interface AgenticTool {
  name: string;
  summary: string;
  category: "links" | "attribution" | "docs" | "lifecycle";
}

export interface AgenticClient {
  slug: string;
  name: string;
  installType:
    | "stdio"
    | "remote-mcp"
    | "deep-link"
    | "config-snippet"
    | "framework-plugin"
    | "rest-or-sdk";
  description: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.go2.gg";
const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.go2.gg";

export const agenticManifest = {
  product: {
    name: siteConfig.name,
    tagline: "Short links your AI agent can call.",
    pitch:
      "Go2 is the link toolkit your AI agent calls. One MCP install gives any agent runtime a complete short-URL platform: create branded links, capture click-by-click analytics, attribute every click back to the (agent_id, run_id, tool_call_id, actor_id) that produced it, and control link lifecycle (expire, single-use, revoke). Built on Cloudflare Workers + D1 + KV. Open source (AGPL). Humans get a dashboard; agents get the tools.",
    siteUrl: siteConfig.url,
    apiUrl,
    mcpUrl,
    docsUrl: `${siteConfig.url}/docs`,
    statusUrl: `${siteConfig.url}/status`,
    contactEmail: siteConfig.email,
    repository: siteConfig.links.github ?? "https://github.com/rakesh1002/go2.gg",
  },

  concepts: [
    {
      name: "link",
      description:
        "A short URL with destination, expiry, geo/device targeting, password gating, click cap, and optional agent attribution context.",
    },
    {
      name: "click",
      description:
        "A single redirect event with geo, device, browser, OS, referrer, bot detection, uniqueness, and any agent attribution captured at redirect time.",
    },
    {
      name: "agent_id",
      description:
        "Stable identifier for the agent that created or invoked the link (e.g. claude-code, cursor, gpt-5-task-runner).",
    },
    {
      name: "agent_run_id",
      description:
        "Per-execution identifier so you can attribute every click back to the specific agent run that produced the link.",
    },
    {
      name: "agent_actor_id",
      description: "Optional end-user / persona identifier for the human the agent acted on behalf of.",
    },
    {
      name: "agent_tool_call_id",
      description:
        "Optional MCP tool-call id captured at click time so individual tool invocations resolve to clicks.",
    },
  ] as const,

  endpoints: [
    {
      method: "POST",
      path: "/api/v1/links",
      summary: "Create a tracked short link. Accepts agent attribution context inline.",
      scopes: ["links:write"],
    },
    {
      method: "GET",
      path: "/api/v1/links",
      summary: "List links for the authenticated org, paginated and searchable.",
      scopes: ["links:read"],
    },
    {
      method: "GET",
      path: "/api/v1/links/{id}",
      summary: "Fetch a single link by id.",
      scopes: ["links:read"],
    },
    {
      method: "PATCH",
      path: "/api/v1/links/{id}",
      summary: "Update destination, expiry, click limit, targeting, or agent attribution.",
      scopes: ["links:write"],
    },
    {
      method: "DELETE",
      path: "/api/v1/links/{id}",
      summary: "Archive a link. Existing redirects return 410.",
      scopes: ["links:write"],
    },
    {
      method: "GET",
      path: "/api/v1/agent-attribution",
      summary: "Stream of clicks filtered by agent_id / agent_run_id / link_id.",
      scopes: ["attribution:read"],
    },
    {
      method: "GET",
      path: "/api/v1/agent-attribution/summary",
      summary: "Click rollup grouped by agent_id or agent_run_id.",
      scopes: ["attribution:read"],
    },
    {
      method: "GET",
      path: "/api/v1/agent-attribution/runs",
      summary: "Distinct agent runs with click counts and first/last timestamps.",
      scopes: ["attribution:read"],
    },
    {
      method: "GET",
      path: "/api/v1/analytics/{linkId}",
      summary: "Per-link analytics: geo, device, browser, OS, referrer breakdowns.",
      scopes: ["analytics:read"],
    },
    {
      method: "POST",
      path: "/api/v1/qr",
      summary: "Generate a QR code (PNG or SVG) for a link.",
      scopes: ["links:read"],
    },
    {
      method: "GET",
      path: "/api/v1/api-keys",
      summary: "List API keys for the authenticated organization.",
      scopes: ["*"],
    },
    {
      method: "POST",
      path: "/api/v1/api-keys",
      summary: "Provision a new API key. Plaintext returned once at creation time.",
      scopes: ["*"],
    },
    {
      method: "GET",
      path: "/api/v1/webhooks",
      summary: "List outgoing webhook subscriptions.",
      scopes: ["webhooks:read"],
    },
    {
      method: "POST",
      path: "/api/v1/webhooks",
      summary: "Subscribe a URL to events such as click, link.created, qr.scanned.",
      scopes: ["webhooks:write"],
    },
    {
      method: "GET",
      path: "/api/v1/usage",
      summary: "Current-period usage counters: links created, clicks, custom domains.",
      scopes: ["*"],
    },
  ] as const satisfies readonly AgenticEndpoint[],

  scopes: [
    { name: "links:read", description: "List and read links." },
    { name: "links:write", description: "Create, update, and archive links." },
    { name: "analytics:read", description: "Read per-link click analytics." },
    { name: "attribution:read", description: "Read agent attribution streams and rollups." },
    { name: "attribution:write", description: "Mutate agent attribution metadata on links." },
    { name: "webhooks:read", description: "List webhook subscriptions." },
    { name: "webhooks:write", description: "Manage webhook subscriptions." },
  ] as const,

  mcp: {
    name: "go2",
    npmPackage: "go2-mcp-server",
    npmSdk: "go2-sdk",
    minVersion: "0.2.0",
    transports: ["stdio", "http"],
    remoteEndpoint: `${mcpUrl}/mcp`,
    sseEndpoint: `${mcpUrl}/sse`,
    auth: {
      type: "oauth2",
      authorizationUrl: `${apiUrl}/api/v1/auth/oauth2/authorize`,
      tokenUrl: `${apiUrl}/api/v1/auth/oauth2/token`,
      registrationUrl: `${apiUrl}/api/v1/auth/oauth2/register`,
      scopesSupported: [
        "links:read",
        "links:write",
        "analytics:read",
        "attribution:read",
        "attribution:write",
      ],
    },
    tools: [
      { name: "create_link", summary: "Create a short link.", category: "links" },
      { name: "list_links", summary: "List links for the authenticated org.", category: "links" },
      { name: "get_link", summary: "Fetch a single link by id.", category: "links" },
      { name: "update_link", summary: "Update an existing link.", category: "links" },
      { name: "delete_link", summary: "Archive a link.", category: "links" },
      { name: "bulk_create_links", summary: "Create many links in one call.", category: "links" },
      { name: "get_analytics", summary: "Per-link analytics roll-up.", category: "links" },
      {
        name: "track_agent_link",
        summary: "Create a link and stamp it with agent_id, agent_run_id, agent_actor_id.",
        category: "attribution",
      },
      {
        name: "get_run_attribution",
        summary: "Click stream for a given agent_run_id / agent_id / link.",
        category: "attribution",
      },
      {
        name: "list_agent_runs",
        summary: "Distinct agent runs with click counts and first/last timestamps.",
        category: "attribution",
      },
      {
        name: "create_revocable_link",
        summary: "Create a single-use link that 410s after one click.",
        category: "lifecycle",
      },
      {
        name: "create_expiring_link",
        summary: "Create a link with TTL in minutes.",
        category: "lifecycle",
      },
      {
        name: "revoke_run_links",
        summary: "Archive every link associated with a given agent_run_id.",
        category: "lifecycle",
      },
      { name: "search_docs", summary: "Search Go2 documentation.", category: "docs" },
      { name: "get_doc", summary: "Fetch a documentation page by slug.", category: "docs" },
      { name: "list_docs", summary: "Enumerate documentation pages.", category: "docs" },
    ] as const satisfies readonly AgenticTool[],
  },

  clients: [
    {
      slug: "claude-code",
      name: "Claude Code",
      installType: "stdio",
      description: "Anthropic's CLI agent. Install Go2 with `claude mcp add go2 npx go2-mcp-server`.",
    },
    {
      slug: "claude-desktop",
      name: "Claude Desktop",
      installType: "stdio",
      description: "Anthropic's macOS/Windows app. Add a stdio entry to claude_desktop_config.json.",
    },
    {
      slug: "claude-web",
      name: "Claude.ai (web + iOS)",
      installType: "remote-mcp",
      description: "Add Go2 as a remote MCP connector. OAuth 2.1 sign-in, no local install required.",
    },
    {
      slug: "cursor",
      name: "Cursor",
      installType: "deep-link",
      description: "Deep-link install via cursor:// URL. One-click from go2.gg/developers/mcp.",
    },
    {
      slug: "windsurf",
      name: "Windsurf",
      installType: "config-snippet",
      description: "Add a stdio entry to windsurf MCP config.",
    },
    {
      slug: "codex",
      name: "OpenAI Codex CLI",
      installType: "config-snippet",
      description: "AGENTS.md plus an MCP stdio entry in ~/.codex/config.toml.",
    },
    {
      slug: "chatgpt",
      name: "ChatGPT",
      installType: "remote-mcp",
      description: "Connect Go2 as an Apps SDK / plugin manifest source.",
    },
    {
      slug: "perplexity",
      name: "Perplexity",
      installType: "config-snippet",
      description: "Plugin manifest at /.well-known/ai-plugin.json.",
    },
    {
      slug: "raycast",
      name: "Raycast AI",
      installType: "config-snippet",
      description: "Configure Raycast to call the Go2 remote MCP endpoint.",
    },
    {
      slug: "mastra",
      name: "Mastra",
      installType: "framework-plugin",
      description:
        "TypeScript agent framework. `pnpm add go2-mastra` then `await createGo2Toolset({ apiKey, agentId })` mounts all four tools on a Mastra Agent in 5 lines.",
    },
    {
      slug: "vercel-ai-sdk",
      name: "Vercel AI SDK",
      installType: "rest-or-sdk",
      description:
        "Use the Go2 TypeScript SDK directly in `tool({ execute })` — REST + agent attribution attached automatically.",
    },
    {
      slug: "langchain",
      name: "LangChain",
      installType: "rest-or-sdk",
      description:
        "Wrap the Go2 SDK in a LangChain `Tool`. Same REST surface, same agent_id propagation.",
    },
  ] as const satisfies readonly AgenticClient[],

  pricing: {
    summary:
      "Free: 100 links / 5K clicks per month, includes full REST API + MCP server + per-run agent attribution. Pro $9/mo: 2K links / 100K clicks + 3 team seats + webhooks/targeting. Business $49/mo: 20K links / 500K clicks + 10 seats + RBAC + SAML SSO + audit logs. Scale: usage-based at $0.40 per 1K agent-attributed events above 500K. Self-host AGPL or commercial license $5K/yr.",
    pricingUrl: `${siteConfig.url}/pricing`,
  },
} as const;

export type AgenticManifest = typeof agenticManifest;

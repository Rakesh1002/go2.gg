# go2-sdk

Official TypeScript SDK for [Go2](https://go2.gg) — short links your AI agent can call.

Create branded short URLs, track every click with edge-native analytics, query per-run agent attribution, and control link lifecycle. Built for AI agents (Claude, Cursor, Codex, Mastra, Vercel AI SDK) and the humans who build with them.

> **For agent runtimes:** install the [`go2-mcp-server`](https://www.npmjs.com/package/go2-mcp-server) MCP server. Same API surface, exposed as MCP tools.

## Installation

```bash
npm install go2-sdk
# or
pnpm add go2-sdk
# or
yarn add go2-sdk
```

## Quick start

```typescript
import { Go2 } from "go2-sdk";

const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });

// Create a tracked short link, stamped with agent context
const link = await go2.links.create({
  destinationUrl: "https://example.com/dashboard",
  slug: "claude-dashboard",
  agentId: "claude-code",
  agentRunId: "run_2026_04_27_a1b2",
  agentActorId: "user_42",
});

console.log(link.shortUrl); // https://go2.gg/claude-dashboard

// Pull the click stream for that run
const { data: clicks } = await go2.agentAttribution.list({
  agentRunId: "run_2026_04_27_a1b2",
});
```

## Why Go2

Every link your agent creates becomes a first-class object:

- **Create** branded short URLs with custom slugs, OG previews, geo/device targeting, password gating
- **Track** every click at the edge in <10ms with geo, device, browser, OS, referrer, bot detection
- **Analyze** per-link rollups: clicks over time, top countries, devices, browsers, referrers
- **Attribute** every click back to `(agent_id, run_id, actor_id, tool_call_id)` — rewind from any click to the run that produced the link
- **Lifecycle** — single-use, expiring, or revocable per agent run
- **Distribute** — custom domains, branded QR codes, OG image scraping, link-in-bio pages

## Agent attribution

Stamp every link with run-level identity. Three ways to provide the context:

### 1. Per-call (most explicit)

```typescript
const link = await go2.links.create({
  destinationUrl: "https://docs.go2.gg",
  agentId: "claude-code",
  agentRunId: "run_abc",
  agentActorId: "user_42",
  agentMetadata: { promptHash: "abc123", toolCall: "tc_xyz" },
});
```

### 2. At click time (when you don't control link creation)

Append short query keys to the short URL — they're stripped before the destination redirect:

```
https://go2.gg/abc?ag=claude-code&ar=run_abc&at=tc_xyz&au=user_42
```

### 3. Via headers (when your agent controls the click origin)

Send `x-agent-id`, `x-agent-run-id`, `x-agent-tool-call-id`, `x-agent-actor-id`.

### Querying attribution

```typescript
// Click stream for a specific run
const { data } = await go2.agentAttribution.list({
  agentRunId: "run_abc",
});

// Roll-up grouped by agent_run_id
const summary = await go2.agentAttribution.summary({
  groupBy: "agent_run_id",
  since: "24h",
});

// Distinct (agent_id, agent_run_id) pairs with click counts
const runs = await go2.agentAttribution.runs();
```

## API reference

### Links

```typescript
// Create
const link = await go2.links.create({
  destinationUrl: "https://example.com",
  slug: "custom-slug",      // optional
  agentId: "claude-code",   // optional — agent attribution
  agentRunId: "run_abc",    // optional
});

// List
const { data, meta } = await go2.links.list({ page: 1, perPage: 20 });

// Read / update / delete
const link = await go2.links.get("lnk_abc");
const updated = await go2.links.update("lnk_abc", { title: "Updated" });
await go2.links.delete("lnk_abc");

// Per-link analytics
const stats = await go2.links.stats("lnk_abc");
```

### Agent attribution

```typescript
// Click stream by agent_id / agent_run_id / agent_actor_id / link_id
const { data } = await go2.agentAttribution.list({ agentRunId: "run_abc" });

// Roll-up by agent_id or agent_run_id
const summary = await go2.agentAttribution.summary({ groupBy: "agent_run_id" });

// Distinct runs with click counts
const runs = await go2.agentAttribution.runs();
```

### Domains

```typescript
const { data } = await go2.domains.list();
const domain = await go2.domains.create({ domain: "links.example.com" });
const verified = await go2.domains.verify(domain.id);
```

### Webhooks

```typescript
const webhook = await go2.webhooks.create({
  name: "Click Tracker",
  url: "https://your-server.com/webhooks/go2",
  events: ["click", "link.created"],
});

// Secret is returned ONCE on creation
console.log(webhook.secret);
```

### QR codes

```typescript
const qr = await go2.qr.generate({
  url: "https://go2.gg/my-link",
  size: 512,
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
});
```

### Galleries (link-in-bio)

```typescript
const gallery = await go2.galleries.create({
  slug: "myprofile",
  title: "John Doe",
  theme: "gradient",
});

await go2.galleries.addItem(gallery.id, {
  type: "link",
  title: "My Website",
  url: "https://example.com",
});
```

## Error handling

```typescript
import { Go2, Go2Error } from "go2-sdk";

try {
  await go2.links.create({ destinationUrl: "not-a-url" });
} catch (error) {
  if (error instanceof Go2Error) {
    console.error(error.code, error.status, error.message);
  }
}
```

## Configuration

```typescript
const go2 = new Go2({
  apiKey: process.env.GO2_API_KEY!,
  apiUrl: "https://api.go2.gg", // override for self-host or staging
});
```

## TypeScript

Fully typed. All inputs, outputs, and errors have full TS definitions. Works in Node 18+, Bun, Deno, Cloudflare Workers, browsers (with caveats — keep your API key on the server).

## Self-host

Go2 is AGPL-3.0. Self-host on Cloudflare Workers + D1 + KV with one `wrangler deploy`. See [github.com/rakesh1002/go2.gg](https://github.com/rakesh1002/go2.gg). Commercial license available for proprietary use — contact hello@go2.gg.

## Links

- Homepage: https://go2.gg
- Agents pitch: https://go2.gg/agents
- 5-min quickstart: https://go2.gg/agents/quickstart
- API reference: https://go2.gg/developers/api
- MCP server: https://www.npmjs.com/package/go2-mcp-server
- Source: https://github.com/rakesh1002/go2.gg

## License

AGPL-3.0-only. Commercial license available — contact hello@go2.gg.

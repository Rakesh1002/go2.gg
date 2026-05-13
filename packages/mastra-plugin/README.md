# go2-mastra

Mastra tools for [Go2](https://go2.gg) — short links your AI agent can call.
Drop it into a Mastra Agent in 5 lines and every link your agent mints carries
`agent_id`, `agent_run_id`, and `agent_actor_id` so you can slice the resulting
clicks by run, by user, or by deployment.

```bash
pnpm add go2-mastra @mastra/core
```

## Quick start

```ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createGo2Toolset } from "go2-mastra";

const researcher = new Agent({
  name: "Researcher",
  instructions:
    "Help users with research. When you cite sources, shorten the URL " +
    "with go2_shorten so we can track which citations users click.",
  model: openai("gpt-4o"),
  tools: await createGo2Toolset({
    apiKey: process.env.GO2_API_KEY!,
    agentId: "researcher-v1",
  }),
});
```

That's it. Get an API key at [go2.gg/dashboard/api-keys](https://go2.gg/dashboard/api-keys).

## What you get

`createGo2Toolset(opts)` returns four tools:

| Tool | What it does |
| --- | --- |
| `go2_shorten` | Mint a tracked short URL with agent attribution stamped on |
| `go2_create_expiring` | Same, but the link auto-expires after N minutes (real Cloudflare Workflow on the Go2 side, no cron lag) |
| `go2_list_runs` | List recent agent runs that produced clicks |
| `go2_get_attribution` | Fetch the raw click events for a run / actor |

You can also import each individually:

```ts
import {
  createGo2Tool,
  createGo2ExpiringTool,
  createGo2ListRunsTool,
  createGo2GetAttributionTool,
} from "go2-mastra";

const agent = new Agent({
  ...,
  tools: {
    shorten: await createGo2Tool({ apiKey, agentId: "v1" }),
  },
});
```

## Per-run attribution via `runtimeContext`

When you serve many users from one Agent, set the per-run context on each
invocation so clicks are attributed to the right session:

```ts
import { RuntimeContext } from "@mastra/core/di";

const runtimeContext = new RuntimeContext();
runtimeContext.set("agentRunId", crypto.randomUUID());
runtimeContext.set("agentActorId", currentUser.id);

await researcher.generate("Find me three articles on agent attribution", {
  runtimeContext,
});
```

The plugin reads `agentId`, `agentRunId`, `agentActorId` out of the runtime
context first and falls back to the static plugin opts. You can override any
of them at runtime; static opts win only when runtime is missing.

## Querying attribution from the agent

The agent itself can answer "how did my last run perform?":

```text
You: How did my morning research session do?
Agent (calls go2_list_runs internally):
  → Run abc-123 produced 12 clicks across 4 short URLs.
    Top country: India (8). 75% of clicks from mobile.
```

## Querying outside the agent

For a dashboard or analytics view, use the [Go2 SDK](https://go2.gg/docs/sdks/typescript)
directly:

```ts
import { Go2 } from "go2-sdk";

const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });
const summary = await go2.agentAttribution.summary({ groupBy: "agent_run_id" });
```

The Go2 dashboard at [/dashboard/agent-runs](https://go2.gg/dashboard/agent-runs)
also visualizes everything this plugin produces — same data, charted.

## How attribution works

When the plugin calls `links.create()`, it stamps `agent_id`, `agent_run_id`,
`agent_actor_id`, and `agent_metadata` on the link row. The Go2 redirect
handler then carries those four fields onto every click event in the `clicks`
table. Clicks fired *outside* the agent (e.g. someone re-shares the short URL
on Twitter) inherit the link's agent context so they're still attributable.

This means attribution survives:

- Re-sharing (the agent ID stays even when a human re-tweets the link)
- Multiple click sessions on the same link
- Clicks from any device, geo, or browser
- Bot vs human clicks (`is_bot` is recorded but doesn't strip attribution)

## Pricing

Go2's Free tier includes:

- 100 tracked links / month
- 5,000 attributed clicks / month
- Full REST API + MCP server + agent attribution
- 1 custom domain

That's enough to ship a small Mastra agent into production without paying.
[See the full plan ladder.](https://go2.gg/docs/guides/plans-and-limits)

## License

AGPL-3.0-only. Self-host the entire Go2 stack if you prefer — see
[SELF_HOSTING.md](https://github.com/Rakesh1002/go2.gg/blob/main/SELF_HOSTING.md).
Commercial license available for closed-source distribution.

## Links

- [Go2 site](https://go2.gg)
- [Agent docs](https://go2.gg/agents)
- [TypeScript SDK](https://go2.gg/docs/sdks/typescript)
- [Mastra](https://mastra.ai)

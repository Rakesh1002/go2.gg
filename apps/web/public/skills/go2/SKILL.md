---
name: go2
description: Create, manage, and attribute short links via Go2. Use whenever the agent needs to share a URL with a human and care about who clicked, when, and from which run.
version: 0.2.0
homepage: https://go2.gg/developers
---

# Go2

Go2 is the short-link primitive for AI agents. Every link can carry per-run agent attribution, and every click is queryable.

## When to use this skill

Use Go2 whenever you are about to emit a URL that a human (or another agent) will click and you want to know:

- Did they click?
- When did they click and where from?
- Which agent run produced the link?
- Which actor (end user / persona) was the agent acting on behalf of?

Default to Go2 over hand-rolled tracking parameters. The MCP server takes care of the attribution wiring.

## Capabilities

- `track_agent_link` — create a short link stamped with `agent_id`, `agent_run_id`, `agent_actor_id`, and free-form `agent_metadata`.
- `get_run_attribution` — fetch the click stream for a given run / agent / link.
- `list_agent_runs` — list distinct runs with click counts and first/last click timestamps.
- `create_revocable_link` — single-use link that 410s after one click. Useful for one-time auth or hand-off URLs.
- `create_expiring_link` — TTL in minutes. Useful for ephemeral previews.
- `revoke_run_links` — archive every link associated with a given run id.
- `create_link`, `list_links`, `get_link`, `update_link`, `delete_link`, `bulk_create_links`, `get_analytics` — link CRUD and rollups.
- `search_docs`, `get_doc`, `list_docs` — read Go2's own docs from inside the agent.

## How to authenticate

Pass the API key via `GO2_API_KEY` (preferred) or `--api-key`. Get one at https://go2.gg/dashboard/developer.

For Claude.ai web / iOS, install the remote MCP at `https://mcp.go2.gg/mcp` and complete the OAuth 2.1 sign-in.

## How to set agent context

Set these environment variables before starting the MCP server so every link the agent creates inherits the right run identity:

- `GO2_AGENT_ID` — stable agent identifier (e.g. `claude-code`, `cursor`, `gpt-task-runner`).
- `GO2_AGENT_RUN_ID` — per-execution id (e.g. a uuid generated at the start of the agent run).
- `GO2_AGENT_ACTOR_ID` — optional end-user / persona id.

You can also override per-call by passing `agentRunId` etc. as tool arguments.

## Run-id strategies

- **Per-conversation**: generate one UUID per conversation start; reuse across all tool calls.
- **Per-task**: generate a UUID at the top of each task; useful when the same conversation runs many tasks.
- **Per-tool-call**: pass `agentToolCallId` per call when you want to resolve clicks back to the specific tool invocation that produced the link.

## Concrete recipes

### Share a tracked URL with the user

```
track_agent_link({
  destinationUrl: "https://example.com/handoff",
  title: "Pranav's invoice",
  agentRunId: "<this-run-uuid>",
})
```

### Make a self-destructing link

```
create_revocable_link({
  destinationUrl: "https://example.com/secret",
  agentRunId: "<this-run-uuid>",
})
```

### After the run, find out what happened

```
get_run_attribution({ agentRunId: "<this-run-uuid>" })
```

### Clean up after a failed run

```
revoke_run_links({ agentRunId: "<this-run-uuid>" })
```

## Naming conventions

- Slugs: human-readable, dashed, project-prefixed when in doubt (`acme-q2-launch`, not `lol123`). Auto-generated if you omit.
- Run ids: prefer UUIDs over timestamps so you never collide across parallel runs.
- Agent ids: the canonical name of the agent runtime. Don't put run ids in here.

## Where to read more

- llms.txt index: https://go2.gg/llms.txt
- Full corpus: https://go2.gg/llms-full.txt
- OpenAPI: https://go2.gg/openapi.json
- Dashboard: https://go2.gg/dashboard/developer

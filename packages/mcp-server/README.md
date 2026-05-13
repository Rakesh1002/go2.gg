# go2-mcp-server

MCP server for [Go2](https://go2.gg) — short links with first-class per-run agent attribution.

Every link an agent creates can carry `(agent_id, agent_run_id, agent_actor_id, agent_tool_call_id)`. Every click is queryable through the same MCP, the REST API, or webhooks.

## Install

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "go2-mcp-server@latest", "--api-key", "go2_xxx"],
      "env": {
        "GO2_AGENT_ID": "claude-desktop",
        "GO2_AGENT_RUN_ID": "set-per-conversation"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add go2 npx -y go2-mcp-server@latest --api-key "$GO2_API_KEY"
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "go2-mcp-server@latest"],
      "env": { "GO2_API_KEY": "go2_xxx" }
    }
  }
}
```

### Windsurf

Add the same stdio entry to `~/.codeium/windsurf/mcp_config.json`.

### Claude.ai web / iOS, ChatGPT (remote MCP)

Add `https://mcp.go2.gg/mcp` as a custom remote MCP server. OAuth 2.1 sign-in handles authentication.

## Configuration

Flags (preferred for `command`-style installs) and env vars (preferred for stdio in apps):

| Flag                  | Env var               | Purpose                                                            |
| --------------------- | --------------------- | ------------------------------------------------------------------ |
| `--api-key`           | `GO2_API_KEY`         | API key from https://go2.gg/dashboard/developer                    |
| `--api-url`           | `GO2_API_URL`         | Override API base. Default `https://api.go2.gg`.                   |
| `--agent-id`          | `GO2_AGENT_ID`        | Stable agent identifier (`claude-code`, `cursor`, ...)             |
| `--agent-run-id`      | `GO2_AGENT_RUN_ID`    | Per-conversation / per-task run id. Generate at run start.         |
| `--agent-actor-id`    | `GO2_AGENT_ACTOR_ID`  | Optional: end-user / persona id the agent is acting on behalf of.  |

Per-call overrides on every tool also take precedence over env vars.

## Tools

### Attribution

| Tool                        | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `track_agent_link`          | Create a short link stamped with the current run context.                 |
| `get_run_attribution`       | Stream of clicks for a run / agent / link.                                |
| `list_agent_runs`           | Distinct (agent_id, agent_run_id) with click counts and timestamps.       |

### Lifecycle

| Tool                        | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `create_revocable_link`     | Single-use link that 410s after one click.                                |
| `create_expiring_link`      | TTL in minutes (default 60, max 30 days).                                 |
| `revoke_run_links`          | Archive every link with a given `agent_run_id`.                           |

### Links

| Tool                | What it does                       |
| ------------------- | ---------------------------------- |
| `create_link`       | Create a short link.               |
| `list_links`        | Paginated list of links.           |
| `get_link`          | Fetch a link by id.                |
| `update_link`       | Update destination/slug/etc.       |
| `delete_link`       | Archive a link.                    |
| `bulk_create_links` | Create many links in one call.     |
| `get_analytics`     | Per-link click analytics rollup.   |

### Docs

| Tool          | What it does                              |
| ------------- | ----------------------------------------- |
| `search_docs` | Search Go2 docs.                          |
| `get_doc`     | Fetch a doc by slug.                      |
| `list_docs`   | List doc pages, optionally by section.    |

## Prompts

The server exposes two starter slash commands:

- `/go2:track-this-run` — "from now on wrap every URL in a Go2 tracked link"
- `/go2:summarize-attribution` — "report on clicks for this run"

## Run-id strategies

- **Per-conversation**: one UUID per conversation start.
- **Per-task**: one UUID per high-level task within a conversation.
- **Per-tool-call**: pass `agentToolCallId` per call for the tightest resolution.

UUIDs > timestamps so you never collide across parallel runs.

## Reference

- Site: https://go2.gg
- API: https://api.go2.gg
- OpenAPI: https://go2.gg/openapi.json
- Skill: https://go2.gg/skills/go2.tar.gz
- Docs: https://go2.gg/developers/mcp
- Source: https://github.com/rakesh1002/go2.gg

## License

AGPL-3.0. Commercial license available — contact hello@go2.gg.

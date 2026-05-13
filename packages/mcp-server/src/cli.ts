#!/usr/bin/env node
/**
 * Go2 MCP Server CLI
 *
 * Usage:
 *   go2-mcp --api-key <your-api-key> [--api-url <api-url>]
 *           [--agent-id <id>] [--agent-run-id <id>] [--agent-actor-id <id>]
 *
 * Agent context is auto-attached to every link created during the session,
 * so downstream click events can be attributed back to a specific run/actor.
 * Falls back to env vars: GO2_AGENT_ID, GO2_AGENT_RUN_ID, GO2_AGENT_ACTOR_ID.
 */

import { runServer } from "./index.js";

interface ParsedArgs {
  apiKey?: string;
  apiUrl?: string;
  agentId?: string;
  agentRunId?: string;
  agentActorId?: string;
  agentToolCallId?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  const flagMap: Record<string, keyof ParsedArgs> = {
    "--api-key": "apiKey",
    "--api-url": "apiUrl",
    "--agent-id": "agentId",
    "--agent-run-id": "agentRunId",
    "--agent-actor-id": "agentActorId",
    "--agent-tool-call-id": "agentToolCallId",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const key = flagMap[arg];
    if (key && args[i + 1]) {
      result[key] = args[i + 1];
      i++;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(`
Go2 MCP Server — link tracking & per-run attribution for AI agents

Usage:
  go2-mcp --api-key <your-api-key> [options]

Options:
  --api-key         Go2 API key (or env GO2_API_KEY)
  --api-url         API URL (or env GO2_API_URL, default https://api.go2.gg)
  --agent-id           Agent identifier (or env GO2_AGENT_ID)
  --agent-run-id       Run/conversation/session ID (or env GO2_AGENT_RUN_ID)
  --agent-actor-id     Human user ID the agent acts on behalf of (or env GO2_AGENT_ACTOR_ID)
  --agent-tool-call-id Tool-call identifier (or env GO2_AGENT_TOOL_CALL_ID)
  --help, -h           Show this help

Tools exposed via MCP:
  Attribution:
    track_agent_link        Create a tracked short link with the current run's attribution baked in
    get_run_attribution     Read back the click stream for a run
    list_agent_runs         Enumerate runs the caller has produced clicks for
  Lifecycle:
    create_revocable_link   Single-use link (410s after one click)
    create_expiring_link    Link with TTL in minutes (default 60, max 30 days)
    revoke_run_links        Archive every link with a given agent_run_id
  Links:
    create_link / list_links / get_link / update_link / delete_link / get_analytics / bulk_create_links
  Docs:
    search_docs / get_doc / list_docs

Prompts: /go2:track-this-run, /go2:summarize-attribution

Example claude_desktop_config.json:
  {
    "mcpServers": {
      "go2": {
        "command": "npx",
        "args": ["go2-mcp-server", "--api-key", "go2_xxx"],
        "env": { "GO2_AGENT_ID": "claude-desktop", "GO2_AGENT_RUN_ID": "<your-run-id>" }
      }
    }
  }
`);
      process.exit(0);
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = args.apiKey ?? process.env.GO2_API_KEY;
  const apiUrl = args.apiUrl ?? process.env.GO2_API_URL ?? "https://api.go2.gg";
  const agentId = args.agentId ?? process.env.GO2_AGENT_ID;
  const agentRunId = args.agentRunId ?? process.env.GO2_AGENT_RUN_ID;
  const agentActorId = args.agentActorId ?? process.env.GO2_AGENT_ACTOR_ID;
  const agentToolCallId = args.agentToolCallId ?? process.env.GO2_AGENT_TOOL_CALL_ID;

  if (!apiKey) {
    console.error("Error: API key is required");
    console.error("Use --api-key <key> or set GO2_API_KEY environment variable");
    process.exit(1);
  }

  await runServer({
    apiKey,
    apiUrl,
    agentContext: {
      agentId,
      agentRunId,
      agentActorId,
      agentToolCallId,
    },
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

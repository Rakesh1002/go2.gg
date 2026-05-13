#!/usr/bin/env bash
# Wrapper that runs the Go2 MCP server with the agent context set from env.
# Usage:
#   GO2_API_KEY=go2_xxx GO2_AGENT_ID=claude-code GO2_AGENT_RUN_ID=$(uuidgen) ./run-mcp.sh

set -euo pipefail

if [ -z "${GO2_API_KEY:-}" ]; then
  echo "GO2_API_KEY is required" >&2
  exit 1
fi

exec npx -y @go2/mcp-server@latest \
  --api-key "${GO2_API_KEY}" \
  ${GO2_AGENT_ID:+--agent-id "$GO2_AGENT_ID"} \
  ${GO2_AGENT_RUN_ID:+--agent-run-id "$GO2_AGENT_RUN_ID"} \
  ${GO2_AGENT_ACTOR_ID:+--agent-actor-id "$GO2_AGENT_ACTOR_ID"} \
  "$@"

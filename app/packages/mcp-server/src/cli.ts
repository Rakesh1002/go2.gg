#!/usr/bin/env node
/**
 * Go2 MCP Server CLI
 *
 * Usage:
 *   go2-mcp --api-key <your-api-key> [--api-url <api-url>]
 *
 * Environment variables:
 *   GO2_API_KEY - Your Go2 API key
 *   GO2_API_URL - API URL (defaults to https://api.go2.gg)
 */

import { runServer } from "./index.js";

function parseArgs(args: string[]): { apiKey?: string; apiUrl?: string } {
  const result: { apiKey?: string; apiUrl?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api-key" && args[i + 1]) {
      result.apiKey = args[i + 1];
      i++;
    } else if (args[i] === "--api-url" && args[i + 1]) {
      result.apiUrl = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Go2 MCP Server - Connect AI assistants to Go2

Usage:
  go2-mcp --api-key <your-api-key> [--api-url <api-url>]

Options:
  --api-key    Your Go2 API key (or set GO2_API_KEY env var)
  --api-url    API URL (defaults to https://api.go2.gg)
  --help, -h   Show this help message

Environment Variables:
  GO2_API_KEY  Your Go2 API key
  GO2_API_URL  API URL

Example Claude Desktop config (claude_desktop_config.json):
  {
    "mcpServers": {
      "go2": {
        "command": "npx",
        "args": ["@go2/mcp-server", "--api-key", "go2_xxx"]
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

  if (!apiKey) {
    console.error("Error: API key is required");
    console.error("Use --api-key <key> or set GO2_API_KEY environment variable");
    process.exit(1);
  }

  await runServer({ apiKey, apiUrl });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

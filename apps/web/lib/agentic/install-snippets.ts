import { agenticManifest } from "./manifest";

export interface InstallSnippet {
  slug: string;
  name: string;
  installType: "stdio" | "remote-mcp" | "deep-link" | "config-snippet";
  description: string;
  content: string;
  contentLabel: string;
  copyPayload: string;
  deepLink?: string;
}

const m = agenticManifest;

const stdioJsonSnippet = (apiKeyPlaceholder = "go2_xxx") => `{
  "mcpServers": {
    "go2": {
      "command": "npx",
      "args": ["-y", "${m.mcp.npmPackage}@latest", "--api-key", "${apiKeyPlaceholder}"],
      "env": {
        "GO2_AGENT_ID": "claude-desktop",
        "GO2_AGENT_RUN_ID": "set-per-conversation"
      }
    }
  }
}`;

const remoteJsonSnippet = `{
  "mcpServers": {
    "go2": {
      "url": "${m.mcp.remoteEndpoint}",
      "transport": "streamable-http"
    }
  }
}`;

const claudeCodeShell = `claude mcp add go2 -- npx -y ${m.mcp.npmPackage}@latest --api-key "$GO2_API_KEY"`;

const codexConfig = `# ~/.codex/config.toml
[mcp.servers.go2]
command = "npx"
args = ["-y", "${m.mcp.npmPackage}@latest"]
env.GO2_API_KEY = "go2_xxx"
env.GO2_AGENT_ID = "codex"`;

const cursorDeepLinkConfig = encodeURIComponent(
  JSON.stringify({
    name: "go2",
    command: "npx",
    args: ["-y", `${m.mcp.npmPackage}@latest`],
    env: { GO2_API_KEY: "go2_xxx" },
  }),
);

export function getInstallSnippets(opts?: { apiKey?: string }): InstallSnippet[] {
  const apiKey = opts?.apiKey ?? "go2_xxx";

  return [
    {
      slug: "claude-code",
      name: "Claude Code",
      installType: "stdio",
      description: "Anthropic's CLI agent. Single command install.",
      content: claudeCodeShell.replace("$GO2_API_KEY", apiKey === "go2_xxx" ? "$GO2_API_KEY" : apiKey),
      contentLabel: "Run in your terminal",
      copyPayload: claudeCodeShell.replace("$GO2_API_KEY", apiKey === "go2_xxx" ? "$GO2_API_KEY" : apiKey),
    },
    {
      slug: "claude-desktop",
      name: "Claude Desktop",
      installType: "stdio",
      description: "Add to claude_desktop_config.json on macOS or Windows.",
      content: stdioJsonSnippet(apiKey),
      contentLabel: "Add to claude_desktop_config.json",
      copyPayload: stdioJsonSnippet(apiKey),
    },
    {
      slug: "claude-web",
      name: "Claude.ai (web + iOS)",
      installType: "remote-mcp",
      description: `Connect a remote MCP at ${m.mcp.remoteEndpoint} with OAuth 2.1.`,
      content: m.mcp.remoteEndpoint,
      contentLabel: 'Paste into "Add custom MCP server" on Claude.ai',
      copyPayload: m.mcp.remoteEndpoint,
    },
    {
      slug: "cursor",
      name: "Cursor",
      installType: "deep-link",
      description: "One-click install via cursor:// deep link, or paste into ~/.cursor/mcp.json.",
      content: stdioJsonSnippet(apiKey),
      contentLabel: "Add to ~/.cursor/mcp.json",
      copyPayload: stdioJsonSnippet(apiKey),
      deepLink: `cursor://anysphere.cursor-deeplink/mcp/install?config=${cursorDeepLinkConfig}`,
    },
    {
      slug: "windsurf",
      name: "Windsurf",
      installType: "config-snippet",
      description: "Add to ~/.codeium/windsurf/mcp_config.json.",
      content: stdioJsonSnippet(apiKey),
      contentLabel: "Add to mcp_config.json",
      copyPayload: stdioJsonSnippet(apiKey),
    },
    {
      slug: "codex",
      name: "OpenAI Codex CLI",
      installType: "config-snippet",
      description: "Add to ~/.codex/config.toml. AGENTS.md is auto-discovered at go2.gg/AGENTS.md.",
      content: codexConfig,
      contentLabel: "Add to ~/.codex/config.toml",
      copyPayload: codexConfig,
    },
    {
      slug: "chatgpt",
      name: "ChatGPT",
      installType: "remote-mcp",
      description:
        "Connect Go2 as an Apps SDK / plugin manifest. ChatGPT can also fetch the OpenAPI spec directly.",
      content: `${m.product.siteUrl}/.well-known/ai-plugin.json`,
      contentLabel: "Plugin manifest URL",
      copyPayload: `${m.product.siteUrl}/.well-known/ai-plugin.json`,
    },
    {
      slug: "perplexity",
      name: "Perplexity",
      installType: "remote-mcp",
      description: "Connect via the remote MCP endpoint with OAuth.",
      content: m.mcp.remoteEndpoint,
      contentLabel: "Remote MCP endpoint",
      copyPayload: m.mcp.remoteEndpoint,
    },
    {
      slug: "raycast",
      name: "Raycast AI",
      installType: "config-snippet",
      description: "Configure as an MCP server in the Raycast AI extension.",
      content: stdioJsonSnippet(apiKey),
      contentLabel: "MCP server config",
      copyPayload: stdioJsonSnippet(apiKey),
    },
    {
      slug: "any-remote",
      name: "Any remote MCP client",
      installType: "remote-mcp",
      description: "Use the Streamable HTTP endpoint with OAuth 2.1.",
      content: remoteJsonSnippet,
      contentLabel: "Remote MCP config",
      copyPayload: remoteJsonSnippet,
    },
  ];
}

/**
 * Go2 MCP Server
 *
 * Enables AI assistants (Claude, ChatGPT, etc.) to manage Go2 short links
 * and access documentation through the Model Context Protocol.
 *
 * Available tools:
 * - search_docs: Search documentation by query
 * - get_doc: Get a specific doc page content
 * - list_docs: List all available doc pages
 * - create_link: Create a new short link
 * - list_links: List existing links
 * - get_link: Get link details
 * - update_link: Update a link
 * - delete_link: Delete a link
 * - get_analytics: Get link analytics
 * - bulk_create_links: Create multiple links at once
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Go2Client, type Go2ClientOptions } from "./client.js";
import { DocsClient } from "./docs.js";
import { TOOLS } from "./tools.js";
import { PROMPTS, getPrompt, type PromptName } from "./prompts.js";
import { dispatchToolCall } from "./dispatch.js";

export interface MCPServerOptions extends Go2ClientOptions {
  docsUrl?: string;
}

export function createMCPServer(options: MCPServerOptions) {
  const client = new Go2Client({
    apiKey: options.apiKey,
    apiUrl: options.apiUrl,
    agentContext: options.agentContext,
  });
  const docsClient = new DocsClient({ baseUrl: options.docsUrl ?? "https://go2.gg" });
  const server = new Server(
    {
      name: "go2-mcp",
      version: "0.2.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: Object.values(PROMPTS),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return getPrompt(name as PromptName, args ?? {});
  });

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(TOOLS),
  }));

  // Handle tool calls — shared with the HTTP transport.
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return dispatchToolCall({ client, docsClient }, name, args);
  });

  return server;
}

export async function runServer(options: MCPServerOptions) {
  const server = createMCPServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Go2 MCP Server running on stdio");
}

export { Go2Client } from "./client.js";
export type { AgentContext, Go2ClientOptions } from "./client.js";
export { DocsClient } from "./docs.js";
export { TOOLS } from "./tools.js";
export type { ToolName } from "./tools.js";
export { PROMPTS, getPrompt } from "./prompts.js";
export type { PromptName } from "./prompts.js";
export { dispatchToolCall } from "./dispatch.js";
export type { DispatchDeps } from "./dispatch.js";

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
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Go2Client, type Go2ClientOptions } from "./client.js";
import { DocsClient } from "./docs.js";
import { TOOLS, type ToolName } from "./tools.js";

export interface MCPServerOptions extends Go2ClientOptions {
  docsUrl?: string;
}

export function createMCPServer(options: MCPServerOptions) {
  const client = new Go2Client(options);
  const docsClient = new DocsClient({ baseUrl: options.docsUrl ?? "https://go2.gg" });
  const server = new Server(
    {
      name: "go2-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(TOOLS),
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name as ToolName) {
        // Documentation tools
        case "search_docs": {
          const { query, limit } = args as { query: string; limit?: number };
          const results = await docsClient.searchDocs(query, limit);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case "get_doc": {
          const { slug } = args as { slug: string };
          const doc = await docsClient.getDoc(slug);
          if (!doc) {
            return {
              content: [
                {
                  type: "text",
                  text: `Document not found: ${slug}`,
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(doc, null, 2),
              },
            ],
          };
        }

        case "list_docs": {
          const { section } = args as { section?: string };
          const docs = await docsClient.listDocs(section);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(docs, null, 2),
              },
            ],
          };
        }

        // Link management tools
        case "create_link": {
          const result = await client.createLink(
            args as {
              destinationUrl: string;
              slug?: string;
              title?: string;
              description?: string;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_links": {
          const result = await client.listLinks(
            args as {
              page?: number;
              perPage?: number;
              search?: string;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_link": {
          const { id } = args as { id: string };
          const result = await client.getLink(id);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "update_link": {
          const { id, ...updates } = args as {
            id: string;
            destinationUrl?: string;
            slug?: string;
            title?: string;
            description?: string;
          };
          const result = await client.updateLink(id, updates);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "delete_link": {
          const { id } = args as { id: string };
          await client.deleteLink(id);
          return {
            content: [
              {
                type: "text",
                text: `Link ${id} deleted successfully`,
              },
            ],
          };
        }

        case "get_analytics": {
          const { id, period } = args as { id: string; period?: string };
          const result = await client.getAnalytics(id, period);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "bulk_create_links": {
          const { links } = args as {
            links: Array<{
              destinationUrl: string;
              slug?: string;
              title?: string;
            }>;
          };
          const results = await client.bulkCreateLinks(links);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
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
export { DocsClient } from "./docs.js";
export { TOOLS } from "./tools.js";

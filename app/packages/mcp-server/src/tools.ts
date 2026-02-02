/**
 * MCP Tool Definitions
 *
 * Defines all available tools for the Go2 MCP server.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TOOLS: Record<string, Tool> = {
  // Documentation tools
  search_docs: {
    name: "search_docs",
    description:
      "Search Go2 documentation by query. Returns matching doc pages with titles and snippets.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find in documentation",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
        },
      },
      required: ["query"],
    },
  },

  get_doc: {
    name: "get_doc",
    description: "Get the full content of a specific documentation page by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The doc page slug (e.g., 'quickstart', 'api/links', 'features/analytics')",
        },
      },
      required: ["slug"],
    },
  },

  list_docs: {
    name: "list_docs",
    description: "List all available documentation pages with titles and descriptions.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          description: "Filter by section (e.g., 'API', 'Features', 'Integrations')",
        },
      },
    },
  },

  // Link management tools
  create_link: {
    name: "create_link",
    description: "Create a new short link. Returns the short URL and link details.",
    inputSchema: {
      type: "object",
      properties: {
        destinationUrl: {
          type: "string",
          description: "The destination URL to shorten (must be a valid URL)",
        },
        slug: {
          type: "string",
          description: "Custom slug for the short URL (optional, auto-generated if not provided)",
        },
        title: {
          type: "string",
          description: "Title for the link (optional, for organization)",
        },
        description: {
          type: "string",
          description: "Description for the link (optional)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorizing the link (optional)",
        },
        expiresAt: {
          type: "string",
          description: "Expiration date in ISO format (optional)",
        },
      },
      required: ["destinationUrl"],
    },
  },

  list_links: {
    name: "list_links",
    description: "List existing short links with optional filtering and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        perPage: {
          type: "number",
          description: "Items per page (default: 20, max: 100)",
        },
        search: {
          type: "string",
          description: "Search query to filter links by slug, URL, or title",
        },
        domain: {
          type: "string",
          description: "Filter by domain",
        },
        tag: {
          type: "string",
          description: "Filter by tag",
        },
        sort: {
          type: "string",
          enum: ["created", "clicks", "updated"],
          description: "Sort order (default: created)",
        },
      },
    },
  },

  get_link: {
    name: "get_link",
    description: "Get details of a specific link by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The link ID",
        },
      },
      required: ["id"],
    },
  },

  update_link: {
    name: "update_link",
    description: "Update an existing link's properties.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The link ID to update",
        },
        destinationUrl: {
          type: "string",
          description: "New destination URL",
        },
        slug: {
          type: "string",
          description: "New slug",
        },
        title: {
          type: "string",
          description: "New title",
        },
        description: {
          type: "string",
          description: "New description",
        },
        isArchived: {
          type: "boolean",
          description: "Archive or unarchive the link",
        },
      },
      required: ["id"],
    },
  },

  delete_link: {
    name: "delete_link",
    description: "Delete a link by ID. This action cannot be undone.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The link ID to delete",
        },
      },
      required: ["id"],
    },
  },

  get_analytics: {
    name: "get_analytics",
    description:
      "Get analytics for a specific link including clicks, geography, devices, and referrers.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The link ID",
        },
        period: {
          type: "string",
          enum: ["24h", "7d", "30d", "90d", "all"],
          description: "Time period for analytics (default: all)",
        },
      },
      required: ["id"],
    },
  },

  bulk_create_links: {
    name: "bulk_create_links",
    description: "Create multiple links at once. Useful for batch operations.",
    inputSchema: {
      type: "object",
      properties: {
        links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              destinationUrl: {
                type: "string",
                description: "The destination URL",
              },
              slug: {
                type: "string",
                description: "Custom slug (optional)",
              },
              title: {
                type: "string",
                description: "Link title (optional)",
              },
            },
            required: ["destinationUrl"],
          },
          description: "Array of links to create",
        },
      },
      required: ["links"],
    },
  },
};

export type ToolName = keyof typeof TOOLS;

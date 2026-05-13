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

  // ---------------------------------------------------------------------------
  // Agent attribution — the wedge.
  // ---------------------------------------------------------------------------
  track_agent_link: {
    name: "track_agent_link",
    description:
      "Create a short link with the current agent's run context attached. Every click on this link is automatically attributed to (agent_id, agent_run_id, agent_actor_id). Use this whenever an AI agent needs to share a tracked URL with a user — e.g. inside a tool-call result, an email draft, or a Slack message — and later wants to know which run drove which clicks. Prefer this over `create_link` when generating links from inside an agent loop.",
    inputSchema: {
      type: "object",
      properties: {
        destinationUrl: {
          type: "string",
          description: "The destination URL the link should redirect to.",
        },
        agentId: {
          type: "string",
          description:
            "Identifier for the agent generating the link (e.g. 'claude-code', 'cursor', 'support-bot'). Falls back to GO2_AGENT_ID env var.",
        },
        agentRunId: {
          type: "string",
          description:
            "Identifier for the current run/conversation/session. Falls back to GO2_AGENT_RUN_ID env var. This is the primary key for downstream attribution.",
        },
        agentActorId: {
          type: "string",
          description:
            "Identifier for the human user the agent is acting on behalf of (e.g. user_id in your application). Falls back to GO2_AGENT_ACTOR_ID env var.",
        },
        agentToolCallId: {
          type: "string",
          description:
            "Identifier for the specific tool call that produced this link, when available (e.g. tool_use.id in the Anthropic API). Stored on every resulting click.",
        },
        slug: { type: "string", description: "Custom slug (optional)." },
        title: { type: "string", description: "Link title (optional)." },
        description: { type: "string", description: "Link description (optional)." },
        agentMetadata: {
          type: "object",
          description:
            "Free-form JSON metadata attached to the link (e.g. { prompt_hash, tool_name, intent }). Stored on the link, not propagated to clicks.",
        },
      },
      required: ["destinationUrl"],
    },
  },

  get_run_attribution: {
    name: "get_run_attribution",
    description:
      "Fetch the click stream for a specific agent run, or for the current ambient run if none is given. Returns click rows with country/device/browser/referrer plus the agent context fields. Use this when the agent needs to answer 'who clicked the link I sent in turn N' or 'how did this user respond to the artifact I shared'.",
    inputSchema: {
      type: "object",
      properties: {
        agentRunId: {
          type: "string",
          description: "Run ID to query. Defaults to GO2_AGENT_RUN_ID if unset.",
        },
        agentId: {
          type: "string",
          description: "Optional agent ID filter.",
        },
        linkId: {
          type: "string",
          description: "Optional link ID to scope to a single link.",
        },
        perPage: {
          type: "number",
          description: "Page size (default 50, max 200).",
        },
        page: { type: "number", description: "Page number (default 1)." },
      },
    },
  },

  list_agent_runs: {
    name: "list_agent_runs",
    description:
      "List distinct (agentId, agentRunId) pairs that have produced at least one click for the caller. Useful when the agent wants to enumerate prior runs it has tracked. Returns click counts and first/last click timestamps per run, ordered by recency.",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Filter by a specific agent_id." },
        limit: { type: "number", description: "Max rows (default 100, max 500)." },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Lifecycle tools — single-use, expiring, revocable per run.
  // ---------------------------------------------------------------------------
  create_revocable_link: {
    name: "create_revocable_link",
    description:
      "Create a single-use short link that 410s after one click. Stamped with the agent's run context. Use for one-time auth URLs, hand-off links, or any artifact that must self-destruct after first access.",
    inputSchema: {
      type: "object",
      properties: {
        destinationUrl: { type: "string", description: "URL to redirect to." },
        title: { type: "string" },
        description: { type: "string" },
        slug: { type: "string" },
        agentId: { type: "string" },
        agentRunId: { type: "string" },
        agentActorId: { type: "string" },
        agentMetadata: { type: "object" },
      },
      required: ["destinationUrl"],
    },
  },

  create_expiring_link: {
    name: "create_expiring_link",
    description:
      "Create a link with a TTL in minutes (default 60). After expiry the link 410s. Use for ephemeral previews, time-boxed handoffs, or any URL that should not outlive the run.",
    inputSchema: {
      type: "object",
      properties: {
        destinationUrl: { type: "string" },
        ttlMinutes: {
          type: "number",
          description: "Minutes from now until the link expires. Default 60. Max 43200 (30 days).",
        },
        title: { type: "string" },
        description: { type: "string" },
        slug: { type: "string" },
        agentId: { type: "string" },
        agentRunId: { type: "string" },
        agentActorId: { type: "string" },
        agentMetadata: { type: "object" },
      },
      required: ["destinationUrl"],
    },
  },

  revoke_run_links: {
    name: "revoke_run_links",
    description:
      "Archive every link associated with a given agent_run_id. Use to clean up after a failed run, or when a user revokes consent for what an agent shared on their behalf. Returns the count of links archived.",
    inputSchema: {
      type: "object",
      properties: {
        agentRunId: {
          type: "string",
          description: "Run ID to revoke. Defaults to GO2_AGENT_RUN_ID.",
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

  // ---------------------------------------------------------------------------
  // Folders — organize links into named groups. Pro plan or higher.
  // ---------------------------------------------------------------------------
  create_folder: {
    name: "create_folder",
    description:
      "Create a folder to organize links. Use when an agent is generating multiple related links (e.g. one per campaign, project, or run) and wants to group them. Requires the caller's plan to allow folders.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Folder name (1-100 chars)." },
        description: {
          type: "string",
          description: "Optional folder description (≤ 500 chars).",
        },
        color: {
          type: "string",
          description: "Hex color like #6366f1 (optional, defaults to indigo).",
        },
        icon: {
          type: "string",
          description: "Lucide icon name (optional, defaults to 'folder').",
        },
        parentId: {
          type: "string",
          description: "Parent folder UUID for nested folders (optional).",
        },
      },
      required: ["name"],
    },
  },

  list_folders: {
    name: "list_folders",
    description:
      "List the caller's folders. Returns folder metadata and link counts. Pass a parentId to walk a sub-tree, otherwise returns root-level folders.",
    inputSchema: {
      type: "object",
      properties: {
        parentId: { type: "string", description: "Parent folder UUID to scope to (optional)." },
        page: { type: "number", description: "Page number (default 1)." },
        perPage: { type: "number", description: "Page size (default 50, max 100)." },
      },
    },
  },

  get_folder: {
    name: "get_folder",
    description: "Fetch a single folder by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Folder UUID." } },
      required: ["id"],
    },
  },

  update_folder: {
    name: "update_folder",
    description:
      "Rename, recolor, re-icon, or reparent a folder. Pass `parentId: null` (or omit) to leave the parent unchanged.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Folder UUID." },
        name: { type: "string" },
        description: { type: "string" },
        color: { type: "string" },
        icon: { type: "string" },
        parentId: { type: "string" },
      },
      required: ["id"],
    },
  },

  delete_folder: {
    name: "delete_folder",
    description:
      "Delete a folder. Links inside are not deleted — they're moved out of the folder. Sub-folders are reparented to the deleted folder's parent.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Folder UUID." } },
      required: ["id"],
    },
  },

  move_links_to_folder: {
    name: "move_links_to_folder",
    description:
      "Move one or more links into a folder. Pass an empty `folderId` (or use `remove_links_from_folder`) to clear assignment. Useful for batch organizing AI-generated links by run.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Destination folder UUID." },
        linkIds: {
          type: "array",
          items: { type: "string" },
          description: "Link UUIDs to move (max 100).",
        },
      },
      required: ["folderId", "linkIds"],
    },
  },

  remove_links_from_folder: {
    name: "remove_links_from_folder",
    description: "Remove links from a folder without deleting them.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Folder UUID the links currently live in." },
        linkIds: {
          type: "array",
          items: { type: "string" },
          description: "Link UUIDs to remove (max 100).",
        },
      },
      required: ["folderId", "linkIds"],
    },
  },

  get_folder_analytics: {
    name: "get_folder_analytics",
    description:
      "Aggregate clicks/uniques/top-country/top-device/top-links across every link in a folder. Use when the agent needs a campaign- or project-level performance view.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Folder UUID." },
        period: {
          type: "string",
          enum: ["7d", "30d", "90d"],
          description: "Time window (default 30d).",
        },
      },
      required: ["folderId"],
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

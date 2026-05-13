"use client";

import { useEffect } from "react";
import { agenticManifest } from "@/lib/agentic/manifest";

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  provideContext: (config: { tools: ToolDefinition[] }) => { unregister?: () => void } | undefined;
};

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

const CLIENT_SLUGS = agenticManifest.clients.map((c) => c.slug);

export function WebMcpBridge() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.modelContext) {
      return;
    }

    const tools: ToolDefinition[] = [
      {
        name: "get_mcp_install_snippet",
        description:
          "Return the install snippet for the Go2 MCP server in a given AI client (Claude Code, Claude Desktop, Cursor, Windsurf, Codex, ChatGPT, Perplexity, Raycast, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            client: {
              type: "string",
              enum: CLIENT_SLUGS,
              description: "Slug of the AI client to install Go2 in.",
            },
          },
          required: ["client"],
          additionalProperties: false,
        },
        execute: (args) => {
          const slug = String((args as { client?: string }).client ?? "");
          const client = agenticManifest.clients.find((c) => c.slug === slug);
          if (!client) {
            return {
              error: `Unknown client "${slug}". Supported: ${CLIENT_SLUGS.join(", ")}`,
            };
          }
          return {
            client: client.name,
            installType: client.installType,
            description: client.description,
            npmPackage: agenticManifest.mcp.npmPackage,
            remoteEndpoint: agenticManifest.mcp.remoteEndpoint,
            sseEndpoint: agenticManifest.mcp.sseEndpoint,
            stdioCommand: `npx -y ${agenticManifest.mcp.npmPackage}@latest`,
            docsUrl: `${agenticManifest.product.siteUrl}/developers/mcp`,
          };
        },
      },
      {
        name: "get_pricing_info",
        description:
          "Return Go2 pricing summary, including free, pro, business, scale tiers and the URL to the live pricing page.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: () => ({
          summary: agenticManifest.pricing.summary,
          pricingUrl: agenticManifest.pricing.pricingUrl,
        }),
      },
    ];

    let registration: { unregister?: () => void } | undefined;
    try {
      registration = navigator.modelContext.provideContext({ tools });
    } catch (error) {
      console.warn("[WebMCP] provideContext failed:", error);
      return;
    }

    return () => {
      registration?.unregister?.();
    };
  }, []);

  return null;
}

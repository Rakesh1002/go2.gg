import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const apiBase = `${m.product.apiUrl}/api/v1`;

  const card = {
    schemaVersion: "0.3.0",
    name: m.mcp.name,
    displayName: m.product.name,
    version: m.mcp.minVersion,
    description: m.product.pitch,
    homepage: m.product.siteUrl,
    documentationUrl: `${m.product.siteUrl}/developers/api`,
    iconUrl: `${m.product.siteUrl}/og-image.png`,
    provider: {
      organization: m.product.name,
      url: m.product.siteUrl,
      contact: m.product.contactEmail,
    },
    supportedInterfaces: [
      {
        transport: "http+json",
        url: apiBase,
        description: "REST API. Bearer-token or OAuth 2.1.",
        authentication: {
          type: "oauth2",
          authorizationUrl: m.mcp.auth.authorizationUrl,
          tokenUrl: m.mcp.auth.tokenUrl,
          registrationUrl: m.mcp.auth.registrationUrl,
          scopes: m.mcp.auth.scopesSupported,
          alternativeSchemes: ["bearer"],
        },
      },
      {
        transport: "mcp+http",
        url: m.mcp.remoteEndpoint,
        description: "Streamable HTTP MCP endpoint.",
        authentication: { type: "oauth2" },
      },
      {
        transport: "mcp+sse",
        url: m.mcp.sseEndpoint,
        description: "Server-Sent Events MCP endpoint.",
        authentication: { type: "oauth2" },
      },
      {
        transport: "mcp+stdio",
        description: "Local stdio MCP server via npm.",
        install: {
          command: "npx",
          args: ["-y", `${m.mcp.npmPackage}@latest`],
          envHints: ["GO2_API_KEY", "GO2_AGENT_ID", "GO2_AGENT_RUN_ID", "GO2_AGENT_ACTOR_ID"],
        },
      },
    ],
    capabilities: {
      streaming: true,
      attribution: true,
      oauth2: true,
      dynamicClientRegistration: true,
      revocableLinks: true,
    },
    skills: m.mcp.tools.map((t) => ({
      id: t.name,
      name: t.name,
      category: t.category,
      description: t.summary,
    })),
    references: {
      mcp: `${m.product.siteUrl}/.well-known/mcp.json`,
      apiCatalog: `${m.product.siteUrl}/.well-known/api-catalog`,
      oauthResource: `${m.product.siteUrl}/.well-known/oauth-protected-resource`,
      openapi: `${m.product.siteUrl}/openapi.json`,
      agentsMd: `${m.product.siteUrl}/AGENTS.md`,
      llmsTxt: `${m.product.siteUrl}/llms.txt`,
    },
  };

  return NextResponse.json(card, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

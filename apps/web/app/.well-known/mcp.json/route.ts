import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const manifest = {
    name: m.mcp.name,
    description: "Go2 short-link primitives for AI agents.",
    version: m.mcp.minVersion,
    homepage: `${m.product.siteUrl}/developers/mcp`,
    repository: m.product.repository,
    license: "AGPL-3.0",
    transports: m.mcp.transports,
    endpoints: {
      streamableHttp: m.mcp.remoteEndpoint,
      sse: m.mcp.sseEndpoint,
    },
    install: {
      stdio: {
        command: "npx",
        args: ["-y", `${m.mcp.npmPackage}@latest`],
        envHints: ["GO2_API_KEY", "GO2_AGENT_ID", "GO2_AGENT_RUN_ID", "GO2_AGENT_ACTOR_ID"],
      },
      remote: {
        url: m.mcp.remoteEndpoint,
        sse: m.mcp.sseEndpoint,
        auth: {
          type: m.mcp.auth.type,
          authorizationUrl: m.mcp.auth.authorizationUrl,
          tokenUrl: m.mcp.auth.tokenUrl,
          registrationUrl: m.mcp.auth.registrationUrl,
          scopesSupported: m.mcp.auth.scopesSupported,
        },
      },
    },
    tools: m.mcp.tools.map((t) => ({
      name: t.name,
      category: t.category,
      summary: t.summary,
    })),
    docs: {
      llms: `${m.product.siteUrl}/llms.txt`,
      llmsFull: `${m.product.siteUrl}/llms-full.txt`,
      openApi: `${m.product.siteUrl}/openapi.json`,
    },
    contact: m.product.contactEmail,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

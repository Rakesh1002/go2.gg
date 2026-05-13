import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const apiAnchor = `${m.product.apiUrl}/api/v1`;

  const linkset = {
    linkset: [
      {
        anchor: apiAnchor,
        "service-desc": [
          {
            href: `${m.product.siteUrl}/openapi.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${m.product.siteUrl}/developers/api`,
            type: "text/html",
          },
        ],
        "service-meta": [
          {
            href: `${m.product.siteUrl}/.well-known/oauth-protected-resource`,
            type: "application/json",
          },
        ],
        status: [
          {
            href: `${m.product.apiUrl}/health`,
            type: "application/json",
          },
        ],
        "terms-of-service": [
          {
            href: `${m.product.siteUrl}/terms`,
            type: "text/html",
          },
        ],
      },
      {
        anchor: m.mcp.remoteEndpoint,
        "service-desc": [
          {
            href: `${m.product.siteUrl}/.well-known/mcp.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${m.product.siteUrl}/developers/mcp`,
            type: "text/html",
          },
        ],
      },
    ],
  };

  return NextResponse.json(linkset, {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

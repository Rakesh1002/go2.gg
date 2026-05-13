import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;

  const metadata = {
    resource: m.product.apiUrl,
    authorization_servers: [m.product.apiUrl],
    scopes_supported: m.scopes.map((s) => s.name),
    bearer_methods_supported: ["header"],
    resource_documentation: `${m.product.siteUrl}/developers/api`,
    resource_policy_uri: `${m.product.siteUrl}/terms`,
    resource_tos_uri: `${m.product.siteUrl}/terms`,
    resource_signing_alg_values_supported: ["RS256"],
    dpop_signing_alg_values_supported: ["RS256", "ES256"],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

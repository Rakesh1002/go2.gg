import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const issuer = m.product.apiUrl;
  const config = {
    issuer,
    authorization_endpoint: m.mcp.auth.authorizationUrl,
    token_endpoint: m.mcp.auth.tokenUrl,
    registration_endpoint: m.mcp.auth.registrationUrl,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"],
    scopes_supported: m.mcp.auth.scopesSupported,
    service_documentation: `${m.product.siteUrl}/developers/mcp`,
  };
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

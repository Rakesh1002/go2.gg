import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const manifest = {
    schema_version: "v1",
    name_for_human: m.product.name,
    name_for_model: "go2",
    description_for_human: "Create, manage, and attribute short links for AI agents and humans.",
    description_for_model:
      "Use this plugin to create tracked short links, query agent attribution (per-run / per-actor), " +
      "fetch click analytics, and manage API keys, domains, and webhooks for the Go2 link platform. " +
      "Every link can carry agent_id, agent_run_id, agent_actor_id, and agent_metadata, so each click " +
      "resolves back to the agent run that produced the link.",
    auth: {
      type: "user_http",
      authorization_type: "bearer",
    },
    api: {
      type: "openapi",
      url: `${m.product.siteUrl}/openapi.json`,
      is_user_authenticated: true,
    },
    logo_url: `${m.product.siteUrl}/og-image.png`,
    contact_email: m.product.contactEmail,
    legal_info_url: `${m.product.siteUrl}/terms`,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

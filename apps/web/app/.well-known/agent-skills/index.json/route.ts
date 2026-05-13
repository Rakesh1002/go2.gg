import { NextResponse } from "next/server";
import { agenticManifest } from "@/lib/agentic/manifest";
import skillsHash from "@/lib/agentic/skills-hash.json";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const m = agenticManifest;
  const go2 = skillsHash.go2;

  const index = {
    $schema: "https://agentskills.io/schema/index/v0.2.0.json",
    publisher: {
      name: m.product.name,
      url: m.product.siteUrl,
      contact: m.product.contactEmail,
    },
    skills: [
      {
        name: "go2",
        type: "claude-code-skill",
        description:
          "Go2 short-link toolkit for AI agents: create branded links, capture click analytics, attribute clicks back to the agent run that produced them.",
        url: `${m.product.siteUrl}/skills/go2.tar.gz`,
        sha256: go2.sha256,
        sizeBytes: go2.sizeBytes,
        tools: m.mcp.tools.map((t) => t.name),
      },
    ],
  };

  return NextResponse.json(index, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

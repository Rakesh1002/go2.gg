import { NextResponse } from "next/server";
import { siteConfig } from "@repo/config";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;

  // Explicitly allowlisted AI crawlers. The default `User-agent: *` rule
  // already covers them, but bot operators check for an explicit entry
  // first — calling them out by name removes ambiguity and is the standard
  // pattern for opt-in to AI training + retrieval.
  const aiCrawlers = [
    "GPTBot", // OpenAI (training)
    "ChatGPT-User", // OpenAI (browsing in ChatGPT)
    "OAI-SearchBot", // OpenAI (SearchGPT)
    "ClaudeBot", // Anthropic
    "Claude-Web", // Anthropic (training)
    "anthropic-ai", // Anthropic (legacy)
    "PerplexityBot", // Perplexity
    "Perplexity-User", // Perplexity (browsing)
    "Google-Extended", // Google AI training opt-in
    "GoogleOther", // Google secondary surfaces
    "CCBot", // Common Crawl
    "Applebot-Extended", // Apple Intelligence training
    "FacebookBot", // Meta
    "meta-externalagent", // Meta agent ingest
    "Bytespider", // ByteDance / Doubao
    "Amazonbot", // Amazon
    "DuckAssistBot", // DuckDuckGo
    "cohere-ai", // Cohere
  ];

  const lines: string[] = [
    "# go2.gg robots policy",
    "# We're agent-friendly — AI crawlers are explicitly allowed and the",
    "# canonical machine-readable surfaces (llms.txt, openapi.json,",
    "# agent-card.json, AGENTS.md) live at the well-known paths below.",
    "",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "",
    "User-agent: *",
    "Allow: /",
    "Allow: /llms.txt",
    "Allow: /llms-full.txt",
    "Allow: /openapi.json",
    "Allow: /AGENTS.md",
    "Allow: /.well-known/",
    "Allow: /skills/",
    "Allow: /developers/",
    "Allow: /docs/",
    "Allow: /agents/",
    "Allow: /compare/",
    "Disallow: /api/",
    "Disallow: /dashboard/",
    "Disallow: /_next/",
    "Disallow: /admin/",
    "",
  ];

  for (const ua of aiCrawlers) {
    lines.push(`User-agent: ${ua}`);
    lines.push("Allow: /");
    lines.push("");
  }

  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  lines.push("");
  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

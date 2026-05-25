import { siteConfig } from "@repo/config";
import { NextResponse } from "next/server";

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

  // Marketing / docs / well-known endpoints — these are the only paths
  // we WANT indexed. Everything else, especially user-generated short-link
  // slugs at the root, is off-limits to crawlers. Slug paths previously
  // weren't disallowed; that's how Google Safe Browsing crawled a
  // phishing-typosquat slug and flagged the entire shortener (2026-05).
  const allowedPrefixes = [
    "/",
    "/about",
    "/blog",
    "/changelog",
    "/compare",
    "/competitors",
    "/contact",
    "/case-studies",
    "/cookies",
    "/dpa",
    "/docs",
    "/events",
    "/features",
    "/free",
    "/guides",
    "/help",
    "/partners",
    "/pricing",
    "/privacy",
    "/security",
    "/solutions",
    "/status",
    "/terms",
    "/tools",
    "/careers",
    "/acceptable-use",
    "/affiliates",
    "/agents",
    "/developers",
    "/skills",
    "/report-abuse",
    "/.well-known",
    "/llms.txt",
    "/llms-full.txt",
    "/openapi.json",
    "/sitemap.xml",
    "/AGENTS.md",
  ];

  const lines: string[] = [
    "# go2.gg robots policy",
    "# Marketing + docs are crawlable. /<slug> short-link paths are NOT.",
    "# User-generated short links must not be indexed: indexed slugs are how",
    "# Google Safe Browsing flags the entire shortener for abusive",
    "# destinations one user pointed at.",
    "",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "",
    "User-agent: *",
    ...allowedPrefixes.map((p) => `Allow: ${p}`),
    "Disallow: /api/",
    "Disallow: /dashboard/",
    "Disallow: /_next/",
    "Disallow: /admin/",
    "Disallow: /r/",
    "Disallow: /cloaked/",
    // Catch-all: every short-link slug lives at /<something> off the root.
    // We end with a wildcard Disallow that all crawlers honour, with the
    // explicit Allow rules above winning by longest-prefix match.
    "Disallow: /",
    "",
  ];

  for (const ua of aiCrawlers) {
    lines.push(`User-agent: ${ua}`);
    for (const p of allowedPrefixes) {
      lines.push(`Allow: ${p}`);
    }
    lines.push("Disallow: /api/");
    lines.push("Disallow: /dashboard/");
    lines.push("Disallow: /admin/");
    lines.push("Disallow: /r/");
    lines.push("Disallow: /cloaked/");
    lines.push("Disallow: /");
    lines.push("");
  }

  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  lines.push("");
  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

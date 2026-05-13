import type { MetadataRoute } from "next";
import { siteConfig } from "@repo/config";
import { getAllBlogPosts } from "@/lib/generated/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // Static pages — agent-focused routes lead the priority list now.
  // Order roughly matches the IA: hero pages → agent surfaces → compares →
  // developer entry points → docs → AEO well-knowns → legal.
  const staticPages = [
    "",
    "/agents",
    "/agents/quickstart",
    "/agents/playground",
    "/compare/dub-vs-go2-for-agents",
    "/compare/bitly",
    "/compare/sink",
    "/compare/short-io",
    "/pricing",
    "/developers",
    "/developers/api",
    "/developers/mcp",
    "/developers/skills",
    "/developers/llms",
    "/features",
    "/about",
    "/contact",
    "/changelog",
    "/blog",
    "/docs",
    "/docs/quickstart",
    "/docs/structure",
    "/docs/api-reference",
    "/docs/api/overview",
    "/docs/api/authentication",
    "/docs/guides/plans-and-limits",
    "/docs/guides/utm-tracking",
    "/docs/integrations/mcp",
    "/docs/integrations/zapier",
    "/docs/integrations/make",
    "/docs/integrations/slack",
    "/docs/sdks/typescript",
    "/llms.txt",
    "/llms-full.txt",
    "/openapi.json",
    "/AGENTS.md",
    "/.well-known/api-catalog",
    "/.well-known/oauth-protected-resource",
    "/.well-known/agent-card.json",
    "/.well-known/agent-skills/index.json",
    "/.well-known/mcp.json",
    "/.well-known/ai-plugin.json",
    "/robots.txt",
    "/terms",
    "/privacy",
    "/cookies",
    "/acceptable-use",
    "/dpa",
  ];

  // Priority map: /agents is the canonical agent landing (1.0). Homepage and
  // playground are co-equal entry points (0.95). Compare pages are SEO
  // long-tail money pages (0.9). Docs sit at 0.7 because they're indexable
  // but rarely the first hop a visitor makes.
  const priorityFor = (path: string): number => {
    if (path === "/agents") return 1.0;
    if (path === "" || path === "/agents/playground") return 0.95;
    if (path === "/agents/quickstart" || path.startsWith("/compare/")) return 0.9;
    if (path === "/pricing" || path === "/developers/mcp" || path === "/developers/api")
      return 0.85;
    if (path.startsWith("/developers")) return 0.8;
    if (path === "/llms.txt" || path === "/llms-full.txt" || path === "/openapi.json")
      return 0.75;
    if (path.startsWith("/docs")) return 0.7;
    if (path.startsWith("/.well-known/")) return 0.7;
    if (path === "/robots.txt") return 0.5;
    return 0.6;
  };

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/agents" ? "daily" : "weekly",
    priority: priorityFor(path),
  }));

  // Blog posts
  const blogPosts = getAllBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}

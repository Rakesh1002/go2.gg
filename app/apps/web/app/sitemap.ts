import type { MetadataRoute } from "next";
import { siteConfig } from "@repo/config";
import { getAllBlogPosts } from "@/lib/generated/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // Static pages
  const staticPages = [
    "",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/changelog",
    "/blog",
    "/docs",
    "/terms",
    "/privacy",
    "/cookies",
    "/acceptable-use",
    "/dpa",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.7,
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

/**
 * MDX Utilities
 *
 * Helpers for reading and parsing MDX content.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "..", "..", "content");

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorImage?: string;
  authorBio?: string;
  image?: string;
  tags: string[];
  published: boolean;
  content: string;
  readingTime: string;
  headings: TocItem[];
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  order: number;
  section?: string;
  content: string;
}

/**
 * Calculate reading time for content
 */
function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Extract headings from MDX content for Table of Contents
 */
export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TocItem[] = [];

  const matches = content.matchAll(headingRegex);
  for (const match of matches) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const posts = getAllBlogPosts();
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Get related posts based on shared tags
 */
export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const allPosts = getAllBlogPosts();
  const currentPost = allPosts.find((p) => p.slug === currentSlug);

  if (!currentPost) return [];

  // Score posts by number of shared tags
  const scoredPosts = allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
      return { post, score: sharedTags.length };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // If no related posts by tags, return most recent
  if (scoredPosts.length === 0) {
    return allPosts.filter((p) => p.slug !== currentSlug).slice(0, limit);
  }

  return scoredPosts.slice(0, limit).map((item) => item.post);
}

/**
 * Get all blog posts
 */
export function getAllBlogPosts(): BlogPost[] {
  const blogDir = path.join(contentDirectory, "blog");

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(blogDir, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug: filename.replace(".mdx", ""),
      title: data.title ?? "Untitled",
      description: data.description ?? "",
      date: data.date ?? new Date().toISOString(),
      author: data.author ?? "Anonymous",
      authorImage: data.authorImage,
      authorBio: data.authorBio,
      image: data.image,
      tags: data.tags ?? [],
      published: data.published !== false,
      content,
      readingTime: calculateReadingTime(content),
      headings: extractHeadings(content),
    } as BlogPost;
  });

  // Sort by date, newest first
  return posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug
 */
export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(contentDirectory, "blog", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title ?? "Untitled",
    description: data.description ?? "",
    date: data.date ?? new Date().toISOString(),
    author: data.author ?? "Anonymous",
    authorImage: data.authorImage,
    authorBio: data.authorBio,
    image: data.image,
    tags: data.tags ?? [],
    published: data.published !== false,
    content,
    readingTime: calculateReadingTime(content),
    headings: extractHeadings(content),
  };
}

/**
 * Get all documentation pages
 */
export function getAllDocPages(): DocPage[] {
  const docsDir = path.join(contentDirectory, "docs");

  if (!fs.existsSync(docsDir)) {
    return [];
  }

  function getDocsRecursively(dir: string, basePath = ""): DocPage[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const pages: DocPage[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPages = getDocsRecursively(
          path.join(dir, entry.name),
          `${basePath}${entry.name}/`
        );
        pages.push(...subPages);
      } else if (entry.name.endsWith(".mdx")) {
        const filePath = path.join(dir, entry.name);
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(fileContents);
        const slug = `${basePath}${entry.name.replace(".mdx", "")}`;

        pages.push({
          slug,
          title: data.title ?? "Untitled",
          description: data.description ?? "",
          order: data.order ?? 999,
          section: data.section,
          content,
        });
      }
    }

    return pages;
  }

  return getDocsRecursively(docsDir).sort((a, b) => a.order - b.order);
}

/**
 * Get a single doc page by slug
 */
export function getDocPage(slug: string): DocPage | null {
  const filePath = path.join(contentDirectory, "docs", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    // Try with index
    const indexPath = path.join(contentDirectory, "docs", slug, "index.mdx");
    if (!fs.existsSync(indexPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(indexPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title ?? "Untitled",
      description: data.description ?? "",
      order: data.order ?? 0,
      section: data.section,
      content,
    };
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title ?? "Untitled",
    description: data.description ?? "",
    order: data.order ?? 0,
    section: data.section,
    content,
  };
}

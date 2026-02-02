/**
 * llms.txt Route
 *
 * Provides a lightweight index of all documentation pages
 * following the llms.txt standard (https://llmstxt.org).
 *
 * This file helps AI assistants understand the structure
 * and content of the documentation.
 */

import { NextResponse } from "next/server";
import { getAllDocPages } from "@/lib/generated/docs";
import { siteConfig } from "@repo/config";

export async function GET() {
  const docs = getAllDocPages();

  // Group docs by section
  const sections: Record<string, typeof docs> = {};
  const ungrouped: typeof docs = [];

  for (const doc of docs) {
    if (doc.section) {
      if (!sections[doc.section]) {
        sections[doc.section] = [];
      }
      sections[doc.section].push(doc);
    } else {
      // Group by first path segment
      const firstSegment = doc.slug.split("/")[0];
      if (doc.slug.includes("/")) {
        const sectionName = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
        if (!sections[sectionName]) {
          sections[sectionName] = [];
        }
        sections[sectionName].push(doc);
      } else {
        ungrouped.push(doc);
      }
    }
  }

  // Build the llms.txt content
  let content = `# ${siteConfig.name} Documentation

> ${siteConfig.description}

## Overview

This file provides an index of ${siteConfig.name} documentation for AI assistants and LLMs.

- Full documentation: /docs/llms-full.txt
- Individual pages: /docs/raw/{slug} (returns markdown)
- Search API: /api/docs-search?q={query}

`;

  // Add getting started / ungrouped docs first
  if (ungrouped.length > 0) {
    content += `## Getting Started\n\n`;
    for (const doc of ungrouped) {
      content += `- [${doc.title}](/docs/${doc.slug}): ${doc.description || "No description"}\n`;
    }
    content += "\n";
  }

  // Add each section
  for (const [sectionName, sectionDocs] of Object.entries(sections)) {
    content += `## ${sectionName}\n\n`;
    for (const doc of sectionDocs) {
      content += `- [${doc.title}](/docs/${doc.slug}): ${doc.description || "No description"}\n`;
    }
    content += "\n";
  }

  // Add footer with metadata
  content += `---

Generated: ${new Date().toISOString()}
Total pages: ${docs.length}
Base URL: ${siteConfig.url}
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

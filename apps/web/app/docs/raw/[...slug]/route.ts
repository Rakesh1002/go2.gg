/**
 * Raw Markdown Route
 *
 * Returns the raw markdown content of a documentation page.
 * Useful for AI tools that want to fetch specific pages.
 *
 * Example: /docs/raw/quickstart -> Returns quickstart.mdx content
 */

import { NextResponse } from "next/server";
import { getDocPage } from "@/lib/generated/docs";
import { siteConfig } from "@repo/config";

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = getDocPage(slugPath);

  if (!doc) {
    return new NextResponse("Document not found", { status: 404 });
  }

  // Build markdown with frontmatter
  const content = `---
title: ${doc.title}
description: ${doc.description || ""}
url: ${siteConfig.url}/docs/${doc.slug}
${doc.section ? `section: ${doc.section}` : ""}
---

# ${doc.title}

${doc.description ? `> ${doc.description}\n\n` : ""}${doc.content}
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

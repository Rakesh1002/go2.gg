/**
 * Docs API Route
 *
 * Returns all documentation pages for external integrations and MCP server.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAllDocPages } from "@/lib/generated/docs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeContent = searchParams.get("content") === "true";
  const slug = searchParams.get("slug");

  const docs = getAllDocPages();

  // If a specific slug is requested, return just that doc
  if (slug) {
    const doc = docs.find((d) => d.slug === slug);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ doc });
  }

  // Return all docs, optionally including content
  const formattedDocs = docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    section: doc.section,
    order: doc.order,
    ...(includeContent ? { content: doc.content } : {}),
  }));

  return NextResponse.json({
    docs: formattedDocs,
    count: formattedDocs.length,
  });
}

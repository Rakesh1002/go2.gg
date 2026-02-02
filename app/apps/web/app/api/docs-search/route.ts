/**
 * Docs Search API Route
 *
 * Provides full-text search across documentation using Orama.
 * Returns matching documents with highlights.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { create, insert, search } from "@orama/orama";
import { getAllDocPages } from "@/lib/generated/docs";

// Cache the search index in memory
let searchIndex: Awaited<ReturnType<typeof create>> | null = null;
let indexInitPromise: Promise<void> | null = null;

interface DocSearchResult {
  slug: string;
  title: string;
  description: string;
  section?: string;
  content: string;
  score: number;
}

async function initializeIndex() {
  if (searchIndex) return;

  const db = await create({
    schema: {
      slug: "string",
      title: "string",
      description: "string",
      section: "string",
      content: "string",
    },
  });

  const docs = getAllDocPages();

  for (const doc of docs) {
    await insert(db, {
      slug: doc.slug,
      title: doc.title,
      description: doc.description || "",
      section: doc.section || "",
      content: doc.content,
    });
  }

  searchIndex = db;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (!query) {
    return NextResponse.json({ results: [], query: "" });
  }

  // Initialize index if not already done
  if (!searchIndex) {
    if (!indexInitPromise) {
      indexInitPromise = initializeIndex();
    }
    await indexInitPromise;
  }

  if (!searchIndex) {
    return NextResponse.json({ error: "Search index not available" }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await search(searchIndex as any, {
    term: query,
    limit,
    boost: {
      title: 3,
      description: 2,
      content: 1,
    },
  });

  const formattedResults: DocSearchResult[] = results.hits.map((hit) => {
    const doc = hit.document as {
      slug: string;
      title: string;
      description: string;
      section: string;
      content: string;
    };

    // Extract a snippet from content around the match
    const contentLower = doc.content.toLowerCase();
    const queryLower = query.toLowerCase();
    const matchIndex = contentLower.indexOf(queryLower);

    let snippet = doc.description;
    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - 50);
      const end = Math.min(doc.content.length, matchIndex + query.length + 100);
      snippet =
        (start > 0 ? "..." : "") +
        doc.content.slice(start, end).trim() +
        (end < doc.content.length ? "..." : "");
    }

    return {
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      section: doc.section,
      content: snippet,
      score: hit.score,
    };
  });

  return NextResponse.json({
    results: formattedResults,
    query,
    count: results.count,
  });
}

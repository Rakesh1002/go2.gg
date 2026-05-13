/**
 * llms-full.txt Route
 *
 * Provides the complete documentation content in a single file
 * for AI assistants that need comprehensive context.
 *
 * This concatenates all documentation pages with clear separators.
 */

import { NextResponse } from "next/server";
import { getAllDocPages } from "@/lib/generated/docs";
import { siteConfig } from "@repo/config";

export async function GET() {
  const docs = getAllDocPages();

  // Build the full documentation content
  let content = `# ${siteConfig.name} - Complete Documentation

> ${siteConfig.description}

This file contains the complete documentation for ${siteConfig.name}.
Total pages: ${docs.length}

---

`;

  // Add each document
  for (const doc of docs) {
    content += `${"=".repeat(80)}
# ${doc.title}

URL: /docs/${doc.slug}
${doc.section ? `Section: ${doc.section}` : ""}
${doc.description ? `Description: ${doc.description}` : ""}

${"=".repeat(80)}

${doc.content}

`;
  }

  // Add footer
  content += `
${"=".repeat(80)}
END OF DOCUMENTATION
${"=".repeat(80)}

Generated: ${new Date().toISOString()}
Base URL: ${siteConfig.url}
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

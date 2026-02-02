/**
 * IndexNow API Endpoint
 *
 * POST /api/seo/indexnow
 *
 * Submit URLs to IndexNow for Bing/Yahoo/Yandex instant indexing.
 * Requires admin API key for authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { submitToIndexNow, submitSitemapToIndexNow } from "@/lib/seo/indexnow";

interface IndexNowRequestBody {
  urls?: string[];
  submitSitemap?: boolean;
}

export async function POST(request: NextRequest) {
  // Verify admin API key
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: IndexNowRequestBody = await request.json();
    const { urls, submitSitemap } = body;

    if (!urls?.length && !submitSitemap) {
      return NextResponse.json(
        { error: "Either urls array or submitSitemap flag is required" },
        { status: 400 }
      );
    }

    let results;

    if (submitSitemap) {
      // Fetch sitemap and extract URLs
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg";
      const sitemapResponse = await fetch(`${siteUrl}/sitemap.xml`);
      const sitemapText = await sitemapResponse.text();

      // Parse sitemap XML to extract URLs
      const urlMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/g) || [];
      const sitemapUrls = urlMatches.map((match) =>
        match.replace("<loc>", "").replace("</loc>", "")
      );

      results = await submitSitemapToIndexNow(sitemapUrls);
    } else {
      results = await submitToIndexNow({ urls: urls! });
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("IndexNow submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit to IndexNow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

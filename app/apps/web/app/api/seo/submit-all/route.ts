/**
 * Unified SEO Submission Endpoint
 *
 * POST /api/seo/submit-all
 *
 * Submit URLs to ALL search engines (Google + IndexNow/Bing/Yahoo/Yandex).
 * Requires admin API key for authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  submitUrlToAllEngines,
  submitUrlsToAllEngines,
  generateSitemapUrls,
} from "@/lib/seo";

interface SubmitAllRequestBody {
  urls?: string[];
  url?: string;
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
    const body: SubmitAllRequestBody = await request.json();
    const { urls, url, submitSitemap } = body;

    let result;

    if (submitSitemap) {
      // Submit all sitemap URLs
      const sitemapUrls = generateSitemapUrls();
      result = await submitUrlsToAllEngines(sitemapUrls);
    } else if (urls?.length) {
      // Submit multiple URLs
      result = await submitUrlsToAllEngines(urls);
    } else if (url) {
      // Submit single URL
      result = await submitUrlToAllEngines(url);
    } else {
      return NextResponse.json(
        { error: "Either urls array, url, or submitSitemap flag is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SEO submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit to search engines",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

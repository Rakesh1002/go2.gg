/**
 * Google Indexing API Endpoint
 *
 * POST /api/seo/google
 *
 * Submit URLs to Google for indexing via the Indexing API.
 * Requires admin API key for authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  submitToGoogleIndexing,
  submitBatchToGoogleIndexing,
  submitSitemapToGoogle,
  getGoogleIndexingStatus,
} from "@/lib/seo/google-indexing";

interface GoogleIndexingRequestBody {
  action: "submit" | "delete" | "status" | "sitemap";
  urls?: string[];
  url?: string;
}

export async function POST(request: NextRequest) {
  // Verify admin API key
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: GoogleIndexingRequestBody = await request.json();
    const { action, urls, url } = body;

    let result;

    switch (action) {
      case "submit":
        if (urls?.length) {
          result = await submitBatchToGoogleIndexing(urls, "URL_UPDATED");
        } else if (url) {
          result = await submitToGoogleIndexing({ url, type: "URL_UPDATED" });
        } else {
          return NextResponse.json(
            { error: "Either urls array or url is required for submit action" },
            { status: 400 }
          );
        }
        break;

      case "delete":
        if (urls?.length) {
          result = await submitBatchToGoogleIndexing(urls, "URL_DELETED");
        } else if (url) {
          result = await submitToGoogleIndexing({ url, type: "URL_DELETED" });
        } else {
          return NextResponse.json(
            { error: "Either urls array or url is required for delete action" },
            { status: 400 }
          );
        }
        break;

      case "status":
        if (!url) {
          return NextResponse.json(
            { error: "url is required for status action" },
            { status: 400 }
          );
        }
        result = await getGoogleIndexingStatus(url);
        break;

      case "sitemap":
        result = await submitSitemapToGoogle();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: submit, delete, status, or sitemap" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google Indexing API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process Google Indexing request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

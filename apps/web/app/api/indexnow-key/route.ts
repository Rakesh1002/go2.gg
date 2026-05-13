/**
 * IndexNow Key Verification Route
 *
 * GET /api/indexnow-key
 *
 * This endpoint serves the IndexNow key for verification.
 * Search engines expect the key at /{key}.txt but we can also
 * specify a custom keyLocation in our IndexNow submissions.
 *
 * The key must match the INDEXNOW_API_KEY environment variable.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.INDEXNOW_API_KEY;

  if (!key) {
    return new NextResponse("IndexNow key not configured", { status: 404 });
  }

  // Return the key as plain text
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}

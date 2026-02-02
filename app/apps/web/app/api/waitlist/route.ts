import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
  referralCode: z.string().optional(),
});

/**
 * POST /api/waitlist
 * Add an email to the waitlist - proxies to the Hono API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = waitlistSchema.parse(body);

    // Get source from referrer if not provided
    const source =
      data.source ?? getSourceFromReferrer(request.headers.get("referer"));

    // Forward to the Hono API which handles storage and email
    const response = await fetch(`${API_URL}/api/v1/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        source,
        referralCode: data.referralCode,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to join waitlist",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 },
      );
    }

    console.error("[Waitlist] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to join waitlist" },
      { status: 500 },
    );
  }
}

/**
 * Extract source from referrer URL
 */
function getSourceFromReferrer(referrer: string | null): string {
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    const pathname = url.pathname.toLowerCase();

    if (pathname.includes("blog")) return "blog";
    if (pathname.includes("pricing")) return "pricing";
    if (pathname === "/" || pathname === "") return "landing";

    return "website";
  } catch {
    return "website";
  }
}

/**
 * GET /api/waitlist
 * Export waitlist (admin only) - proxies to the Hono API
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    // Forward to the Hono API
    const response = await fetch(`${API_URL}/api/v1/waitlist`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("[Waitlist] Export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export waitlist" },
      { status: 500 },
    );
  }
}

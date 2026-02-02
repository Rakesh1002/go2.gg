/**
 * Auth Callback Route
 *
 * Handles OAuth redirects. With Better Auth, OAuth callbacks are handled
 * by the API at /api/auth/callback/:provider. This route handles the
 * final redirect after successful authentication.
 */

import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  // Successfully authenticated, redirect to the intended destination
  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : next;

  return NextResponse.redirect(redirectUrl);
}

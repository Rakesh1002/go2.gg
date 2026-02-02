/**
 * Email Confirmation Route
 *
 * Handles email verification links. With Better Auth, email verification
 * is handled by the API. This route redirects to the API endpoint.
 */

import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=Invalid%20confirmation%20link`);
  }

  // Redirect to API to verify the token
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  // Better Auth handles email verification at /api/v1/auth/verify-email
  const verifyUrl = `${apiUrl}/api/v1/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(`${origin}${next}`)}`;

  return NextResponse.redirect(verifyUrl);
}

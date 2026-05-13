import { type NextRequest, NextResponse } from "next/server";

/**
 * Affiliate landing — /r/<code>
 *
 * Validates the code against the API, sets a 30-day go2_ref_code cookie on
 * go2.gg so the signup flow can attribute the new user back, then redirects
 * to /register?ref=<code>.
 *
 * Behaviour:
 *   - Unknown / not-approved codes → still set the cookie (we don't want to
 *     leak which codes are valid by 404'ing) but redirect to /register
 *     without the ref query param so the signup form doesn't show a banner.
 *   - HttpOnly is intentionally OFF: the signup form reads the cookie
 *     client-side to prefill / show the affiliate's name. The code itself is
 *     not sensitive (it's a public sharing handle).
 */

const COOKIE_NAME = "go2_ref_code";
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SHARE_PARAM = "ref";

function isValidCode(code: string): boolean {
  // Affiliate codes are GO2-XXXXXX-XXXX (uppercase alnum + dashes), max 32.
  return /^[A-Z0-9-]{6,32}$/i.test(code);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  // Reject obvious junk so we don't waste cookies on garbage.
  if (!isValidCode(code)) {
    return NextResponse.redirect(new URL("/register", request.url), 302);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

  // Best-effort code validation. We don't block on it — even if the lookup
  // fails (network blip, API down) we still set the cookie and redirect, so
  // the affiliate's link never feels broken.
  let validApproved = false;
  try {
    const lookup = await fetch(
      `${apiUrl}/api/v1/affiliates/lookup/${encodeURIComponent(code)}`,
      {
        // Public endpoint, no creds. Short timeout via AbortSignal.
        signal: AbortSignal.timeout(2000),
      },
    );
    if (lookup.ok) {
      const body = (await lookup.json().catch(() => null)) as
        | { data?: { exists?: boolean; status?: string } }
        | null;
      validApproved = Boolean(
        body?.data?.exists && body.data.status === "approved",
      );
    }
  } catch {
    // swallow — we still set the cookie below
  }

  // Build redirect target. Only surface the ref query param when the code is
  // known + approved so the register page can show "you were referred by …".
  const dest = new URL("/register", request.url);
  if (validApproved) dest.searchParams.set(SHARE_PARAM, code);

  const response = NextResponse.redirect(dest, 302);
  response.cookies.set(COOKIE_NAME, code, {
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    httpOnly: false,
    path: "/",
  });
  return response;
}

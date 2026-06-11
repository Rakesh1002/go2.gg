import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Password-unlock passthrough. The password page served on go2.gg/<slug>
 * (proxied from the API — see app/[slug]/route.ts) posts to this relative
 * path, so the apex must forward it to the API worker. Proxying rather than
 * redirecting keeps the unlock cookie on go2.gg, where the short-link proxy
 * sends it back on the follow-up request.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = `/api/v1/links/${encodeURIComponent(id)}/verify`;

  try {
    const { env } = getCloudflareContext();
    const apiBinding = (env as { API?: { fetch: typeof fetch } }).API;
    if (apiBinding?.fetch) {
      const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg").origin;
      // Buffer the body — small form payload — to sidestep streaming-body
      // restrictions on subrequests. redirect: "manual" so the API's
      // 302-back-to-the-short-link reaches the browser.
      const upstream = await apiBinding.fetch(`${appOrigin}${path}`, {
        method: "POST",
        headers: request.headers,
        body: await request.arrayBuffer(),
        redirect: "manual",
      });
      return new Response(upstream.body, upstream);
    }
  } catch {
    // Binding unavailable — use the redirect fallback below.
  }

  // 307 preserves the POST method and body across the redirect.
  return NextResponse.redirect(`${API_URL}${path}`, 307);
}

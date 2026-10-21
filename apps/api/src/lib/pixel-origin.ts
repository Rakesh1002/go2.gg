import type { Env, TrackingPixel } from "../bindings.js";
import { getAuthSecret } from "./auth-secret.js";
import { verifyPixelHandoff } from "./pixel-handoff.js";
import { generatePixelTrackingPage } from "./pixel-tracking.js";

/**
 * Handler for the dedicated pixel tracking origin (PIXEL_ORIGIN) — a throwaway,
 * cookieless domain that is NOT go2.gg: it holds no go2 session cookies, is not
 * in the API's CORS allowlist, and carries no trusted brand. That isolation is
 * what makes it safe to run the link owner's third-party and "custom" pixel JS
 * here (run on go2.gg it would be cross-tenant account takeover + trusted-domain
 * phishing). This origin is routed straight to this function in the worker's
 * fetch entrypoint, bypassing the API app (no auth/CORS/session middleware).
 *
 * It serves the interstitial ONLY for a valid, unexpired handoff signature from
 * a go2.gg click that already passed the link gates and was counted. Anything
 * else — a direct hit, tampering, a lapsed signature — is bounced to the
 * canonical resolver (https://<domain>/<slug>), which re-gates and tracks. So
 * this origin can't be used to dodge a click limit, a disabled/expired link, or
 * a password gate, and it never counts a click itself (the go2.gg click did).
 */
export async function servePixelInterstitial(request: Request, env: Env): Promise<Response> {
  const redirect = (location: string): Response =>
    new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
  // An UNVERIFIED request can't trust the `d` param as a host (that would be an
  // open redirect, e.g. ?d=evil.com), so bounce to OUR domain's resolver.
  const bounceDefault = (slug: string): Response =>
    redirect(`https://${env.DEFAULT_DOMAIN || "go2.gg"}/${encodeURIComponent(slug)}`);

  // Catch EVERYTHING: this handler runs outside the API app (it's wired straight
  // into the worker's fetch entrypoint), so a throw must never propagate — it
  // would otherwise fall through to the app on the tracking host (running its
  // middleware, counting a click) or 500. On any pre-verification error we can't
  // trust the request, so bounce to our own domain.
  let slug = "";
  try {
    const url = new URL(request.url);
    try {
      slug = decodeURIComponent(url.pathname.replace(/^\/+/, "").split("/")[0] || "");
    } catch {
      // Malformed percent-encoding in the path — nothing trustworthy to act on.
      return bounceDefault("");
    }
    const dest = url.searchParams.get("dest") ?? "";
    const domain = url.searchParams.get("d") ?? "";
    const exp = Number(url.searchParams.get("exp") ?? "");
    const sig = url.searchParams.get("sig") ?? "";

    if (!slug || !dest || !domain || !sig || !Number.isFinite(exp)) return bounceDefault(slug);

    const status = await verifyPixelHandoff(dest, domain, slug, exp, sig, getAuthSecret(env));
    if (status === "invalid") return bounceDefault(slug);
    if (status === "expired") {
      // Signature is authentic, so `domain` is genuinely this link's domain —
      // bounce there (its own resolver re-gates and mints a fresh handoff),
      // never to the default domain where the slug could 404 or collide.
      return redirect(`https://${domain}/${encodeURIComponent(slug)}`);
    }

    // Valid + fresh. `dest` is covered by the verified signature (the exact
    // A/B-resolved, go2_ref-stamped destination the go2.gg click produced).
    // From here, any error must go to that trusted dest, NOT bounce back to
    // go2.gg — bouncing would re-mint a handoff and loop, counting a click each
    // hop. Read the link only for its current pixel config.
    try {
      const cached = await env.LINKS_KV.get<{
        trackingPixels?: TrackingPixel[];
        enablePixelTracking?: boolean;
        requirePixelConsent?: boolean;
      }>(`${domain}:${slug}`, { type: "json" });
      const pixels =
        cached?.enablePixelTracking && Array.isArray(cached.trackingPixels)
          ? cached.trackingPixels.filter((p) => p?.enabled)
          : [];
      // KV miss (cold/just-evicted entry, or a write still propagating) → fire
      // nothing and go to dest. Rare, and only costs that one click's pixels.
      if (pixels.length === 0) return redirect(dest);

      const html = generatePixelTrackingPage(dest, pixels, {
        requireConsent: !!cached?.requirePixelConsent,
      });
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          // Sacrificial, isolated origin → a permissive script policy is fine
          // (the owner's pixels must run). Still not framable, never cached.
          "content-security-policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'unsafe-inline' https:; img-src https: data:; connect-src https:; frame-ancestors 'none'; base-uri 'none'",
          "x-frame-options": "DENY",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "cache-control": "no-store",
        },
      });
    } catch {
      // Anything went wrong building the page (e.g. a malformed stored pixel) —
      // go straight to the verified dest. No loop, and dest is safe.
      return redirect(dest);
    }
  } catch {
    // Pre-verification failure (e.g. a bad URL): bounce to our own domain.
    return bounceDefault(slug);
  }
}

import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { getAuthSecret } from "../src/lib/auth-secret";
import { signPixelHandoff } from "../src/lib/pixel-handoff";

// Regression guard for the cloaking CSP: the cloaked click response must be
// served with its own frame-permitting, nonce'd CSP, NOT the strict global API
// CSP (default-src 'self'; script-src 'self') which refuses both the iframe and
// the inline loader script and leaves visitors stuck on the spinner forever.
// The generator-only test (cloaked-page.test.ts) can't catch this — it never
// exercises the served headers.

const cloakedLink = {
  id: "l1",
  destinationUrl: "https://flirtly.co/",
  domain: "go2.gg",
  slug: "cloaky",
  rewrite: true,
  threatStatus: "clean",
  createdAt: new Date().toISOString(),
};

function makeEnv(link: unknown, extra: Record<string, unknown> = {}) {
  const kv = {
    async get(key: string) {
      return key === "go2.gg:cloaky" ? link : null;
    },
    async put() {},
    async delete() {},
  };
  return new Proxy(
    { LINKS_KV: kv, DEFAULT_DOMAIN: "go2.gg", ENVIRONMENT: "test", ...extra } as Record<
      string,
      unknown
    >,
    {
      get: (t, p: string) => (p in t ? t[p] : undefined),
    }
  );
}

const ctx = {
  waitUntil(p: Promise<unknown>) {
    if (p && typeof p.catch === "function") p.catch(() => {});
  },
  passThroughOnException() {},
} as unknown as ExecutionContext;

// A ctx that counts waitUntil() calls. Click tracking runs inside waitUntil, so
// the count is a proxy for "was this click tracked": a go2.gg click is tracked
// (>=1), while the tracking-origin hit (served outside the click handler) never
// touches ctx (0), so the click is counted exactly once.
function countingCtx(): { ctx: ExecutionContext; calls: () => number } {
  let n = 0;
  const c = {
    waitUntil(p: Promise<unknown>) {
      n++;
      if (p && typeof p.catch === "function") p.catch(() => {});
    },
    passThroughOnException() {},
  } as unknown as ExecutionContext;
  return { ctx: c, calls: () => n };
}

describe("cloaked link serving (CSP + headers)", () => {
  it("serves the iframe page under a frame-permitting, nonce'd CSP — not the strict API CSP", async () => {
    const res = await worker.fetch(
      new Request("https://go2.gg/cloaky", { headers: { host: "go2.gg" } }),
      makeEnv(cloakedLink) as never,
      ctx
    );
    const body = await res.text();
    const csp = res.headers.get("content-security-policy") ?? "";

    expect(res.status).toBe(200);
    // The regression: the strict API CSP must NOT reach this response.
    expect(csp).not.toContain("default-src 'self'");
    expect(csp).not.toContain("script-src 'self'");
    // The destination iframe and the inline loader must both be permitted.
    expect(csp).toContain("frame-src https:");
    expect(csp).toMatch(/script-src 'nonce-[^']+'/);

    // The CSP nonce must match the nonce on the served <script> tag.
    const cspNonce = csp.match(/script-src 'nonce-([^']+)'/)?.[1];
    expect(cspNonce).toBeTruthy();
    expect(body).toContain(`<script nonce="${cspNonce}">`);
    expect(body).toContain("flirtly.co");

    // Other hardening headers still apply to the cloak response.
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("does NOT cloak an http:// destination (mixed content) — falls through to a redirect", async () => {
    const httpLink = { ...cloakedLink, destinationUrl: "http://example.com/" };
    const env = makeEnv(httpLink) as never;
    // Rebind the KV key to this link (slug is still "cloaky").
    const res = await worker.fetch(
      new Request("https://go2.gg/cloaky", { headers: { host: "go2.gg" } }),
      env,
      ctx
    );
    const body = await res.text();
    const csp = res.headers.get("content-security-policy") ?? "";
    // The invariant: an http destination is NOT served as the cloak page — no
    // per-request nonce CSP and no cloak iframe. (The exact fall-through shape,
    // 302 vs a forward to the WEB binding, depends on bindings absent in tests.)
    expect(csp).not.toMatch(/script-src 'nonce-/);
    expect(body).not.toContain('id="frame"');
  });
});

// Pixel-enabled links run the owner's third-party + "custom" tracking JS, which
// is unsafe on go2.gg (cross-tenant takeover / trusted-domain phishing). The
// click hands off — with a signed, short-lived token — to a dedicated cookieless
// tracking origin (PIXEL_ORIGIN) that runs the JS in isolation, then redirects
// onward. The tracking origin serves ONLY a valid handoff; anything else bounces
// to the canonical resolver (which re-gates + tracks), so it can't be used to
// dodge a gate or a click limit, and it never counts the click itself.
const PIXEL_ORIGIN = "https://testdomain12345678xyz.com";
const PIXEL_HOST = "testdomain12345678xyz.com";
const pixelLink = {
  id: "l2",
  destinationUrl: "https://example.com/",
  domain: "go2.gg",
  slug: "cloaky",
  enablePixelTracking: true,
  trackingPixels: [{ type: "facebook", pixelId: "123456789", enabled: true }],
  threatStatus: "clean",
  createdAt: new Date().toISOString(),
};

describe("pixel tracking origin (separate-origin isolation)", () => {
  it("a go2.gg pixel click hands off (302) to the signed tracking origin, and is tracked", async () => {
    const { ctx: cctx, calls } = countingCtx();
    const res = await worker.fetch(
      new Request("https://go2.gg/cloaky", { headers: { host: "go2.gg" } }),
      makeEnv(pixelLink, { PIXEL_ORIGIN }) as never,
      cctx
    );
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc.startsWith(`${PIXEL_ORIGIN}/cloaky?`)).toBe(true);
    const u = new URL(loc);
    expect(u.searchParams.get("d")).toBe("go2.gg");
    expect(u.searchParams.get("dest")).toContain("example.com");
    expect(u.searchParams.get("sig")).toBeTruthy();
    expect(u.searchParams.get("exp")).toBeTruthy();
    // Counted on go2.gg (the tracking origin never counts it).
    expect(calls()).toBeGreaterThanOrEqual(1);
    // The owner's pixel script is never in the go2.gg response.
    expect(await res.text()).not.toContain("connect.facebook.net");
  });

  it("pixel serving is OFF when PIXEL_ORIGIN is unset — a normal redirect, still tracked", async () => {
    const { ctx: cctx, calls } = countingCtx();
    const res = await worker.fetch(
      new Request("https://go2.gg/cloaky", { headers: { host: "go2.gg" } }),
      makeEnv(pixelLink) as never, // no PIXEL_ORIGIN
      cctx
    );
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toContain("example.com");
    expect(loc).not.toContain(PIXEL_HOST);
    expect(calls()).toBeGreaterThanOrEqual(1);
  });

  it("the tracking origin serves the interstitial for a valid signed handoff, untracked", async () => {
    // End-to-end: take the real signed hand-off the go2.gg click produced, then
    // load it on the tracking-origin host.
    const handoff = await worker.fetch(
      new Request("https://go2.gg/cloaky", { headers: { host: "go2.gg" } }),
      makeEnv(pixelLink, { PIXEL_ORIGIN }) as never,
      ctx
    );
    const loc = handoff.headers.get("location") ?? "";
    expect(loc.startsWith(PIXEL_ORIGIN)).toBe(true);

    const { ctx: cctx, calls } = countingCtx();
    const res = await worker.fetch(
      new Request(loc, { headers: { host: PIXEL_HOST } }),
      makeEnv(pixelLink, { PIXEL_ORIGIN }) as never,
      cctx
    );
    const body = await res.text();
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(res.status).toBe(200);
    // The pixels fire here (on the isolated origin), and the page redirects on.
    expect(body).toContain("connect.facebook.net");
    expect(body).toContain("example.com");
    expect(csp).toMatch(/script-src [^;]*'unsafe-inline'/);
    expect(csp).toMatch(/script-src [^;]*https:/);
    // Isolated: not framable, not cacheable, and the click is NOT re-counted here.
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(calls()).toBe(0);
  });

  it("the tracking origin bounces a forged request to our own domain — no owner JS, no open redirect", async () => {
    const forged = new URL(`${PIXEL_ORIGIN}/cloaky`);
    forged.searchParams.set("dest", "https://evil.example/phish");
    // A forged request can't be trusted for the bounce host either: ?d must not
    // become an open redirect.
    forged.searchParams.set("d", "evil.example");
    // Past exp too: a forged sig must read 'invalid' (HMAC first), never
    // 'expired' — otherwise it would redirect to the attacker's ?d host.
    forged.searchParams.set("exp", String(Date.now() - 60_000));
    forged.searchParams.set("sig", "deadbeef");
    const res = await worker.fetch(
      new Request(forged.toString(), { headers: { host: PIXEL_HOST } }),
      makeEnv(pixelLink, { PIXEL_ORIGIN }) as never,
      ctx
    );
    const body = await res.text();
    expect(res.status).toBe(302);
    // Bounced to OUR domain's resolver — never the forged dest or ?d host, never owner JS.
    expect(res.headers.get("location")).toBe("https://go2.gg/cloaky");
    expect(body).not.toContain("connect.facebook.net");
    expect(body).not.toContain("evil.example");
  });

  it("a malformed path on the tracking origin bounces to our domain — never falls through to the app, no click", async () => {
    // %E0 is an incomplete UTF-8 escape → decodeURIComponent throws. That throw
    // must be caught inside the handler and bounced, NOT propagate and fall
    // through to the Hono app on the tracking host (which would run the API
    // middleware, count a click, and could loop by re-minting a handoff).
    const { ctx: cctx, calls } = countingCtx();
    const res = await worker.fetch(
      new Request("https://testdomain12345678xyz.com/%E0promo", { headers: { host: PIXEL_HOST } }),
      makeEnv(pixelLink, { PIXEL_ORIGIN }) as never,
      cctx
    );
    expect(res.status).toBe(302);
    expect((res.headers.get("location") ?? "").startsWith("https://go2.gg/")).toBe(true);
    // The API app never ran (it would have stamped the strict CSP), and the
    // click was not counted.
    expect(res.headers.get("content-security-policy")).toBeNull();
    expect(calls()).toBe(0);
  });

  it("an expired custom-domain handoff bounces to the SIGNED domain, not the default (wrong-tenant guard)", async () => {
    const env = makeEnv(pixelLink, { PIXEL_ORIGIN });
    const secret = getAuthSecret(env as never);
    const dest = "https://acme.example/promo?go2_ref=x:y";
    // Sign with a `now` in the past → the handoff is authentic but already lapsed.
    const { exp, sig } = await signPixelHandoff(
      dest,
      "links.acme.com",
      "promo",
      secret,
      Date.now() - 120_000
    );
    const u = new URL(`${PIXEL_ORIGIN}/promo`);
    u.searchParams.set("dest", dest);
    u.searchParams.set("d", "links.acme.com");
    u.searchParams.set("exp", String(exp));
    u.searchParams.set("sig", sig);
    const res = await worker.fetch(
      new Request(u.toString(), { headers: { host: PIXEL_HOST } }),
      env as never,
      ctx
    );
    expect(res.status).toBe(302);
    // Back to the link's own domain to re-gate + re-mint — NOT go2.gg, where the
    // slug could 404 or belong to another tenant.
    expect(res.headers.get("location")).toBe("https://links.acme.com/promo");
  });
});

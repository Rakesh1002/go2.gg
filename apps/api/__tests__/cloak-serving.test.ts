import { describe, expect, it } from "vitest";
import worker from "../src/index";

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

function makeEnv(link: unknown) {
  const kv = {
    async get(key: string) {
      return key === "go2.gg:cloaky" ? link : null;
    },
    async put() {},
    async delete() {},
  };
  return new Proxy({ LINKS_KV: kv, DEFAULT_DOMAIN: "go2.gg", ENVIRONMENT: "test" } as Record<
    string,
    unknown
  >, {
    get: (t, p: string) => (p in t ? t[p] : undefined),
  });
}

const ctx = {
  waitUntil(p: Promise<unknown>) {
    if (p && typeof p.catch === "function") p.catch(() => {});
  },
  passThroughOnException() {},
} as unknown as ExecutionContext;

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

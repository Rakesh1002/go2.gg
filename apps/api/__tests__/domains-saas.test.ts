import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./test-d1";

const auth = vi.hoisted(() => ({ userId: "alice" }));

vi.mock("../src/middleware/auth.js", () => ({
  apiKeyAuthMiddleware:
    () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", { id: auth.userId, email: "a@x.test", emailVerified: true });
      await next();
    },
}));

const { domains } = await import("../src/routes/v1/domains");

let env: {
  DB: D1Database;
  DEFAULT_DOMAIN: string;
  LINKS_KV: KVNamespace;
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_SAAS_TOKEN: string;
};
let sqlite: Awaited<ReturnType<typeof createTestD1>>["sqlite"];
let kv: Map<string, string>;

const executionCtx = { waitUntil: () => {}, passThroughOnException: () => {}, props: {} };

beforeEach(async () => {
  auth.userId = "alice";
  const db = await createTestD1();
  sqlite = db.sqlite;
  kv = new Map<string, string>();
  env = {
    DB: db.d1,
    DEFAULT_DOMAIN: "go2.gg",
    CLOUDFLARE_ZONE_ID: "zone1",
    CLOUDFLARE_SAAS_TOKEN: "tok1",
    LINKS_KV: {
      get: async (key: string) => kv.get(key) ?? null,
      put: async (key: string, value: string) => void kv.set(key, value),
      delete: async (key: string) => void kv.delete(key),
    } as unknown as KVNamespace,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function json(method: string, path: string, body?: unknown) {
  return domains.request(
    path,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    env,
    executionCtx
  );
}

/** Stub the DNS-over-HTTPS check + the Cloudflare for SaaS API (no existing
 *  hostname, so the find returns empty and a create runs). Records CF calls. */
function stubCf(calls: string[], txt = "go2-verify=abc") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { method?: string }) => {
      const method = init?.method ?? "GET";
      if (url.includes("cloudflare-dns.com")) {
        return new Response(JSON.stringify({ Answer: [{ data: `"${txt}"` }] }), { status: 200 });
      }
      calls.push(`${method} ${url}`);
      if (url.includes("/custom_hostnames") && method === "GET" && url.includes("hostname=")) {
        return new Response(JSON.stringify({ success: true, errors: [], result: [] }), { status: 200 });
      }
      // POST create (or DELETE)
      return new Response(
        JSON.stringify({
          success: true,
          errors: [],
          result: { id: "ch_new", hostname: "x", status: "pending", ssl: { status: "pending_validation" } },
        }),
        { status: 200 }
      );
    })
  );
}

describe("POST /domains/:id/verify provisioning", () => {
  it("verifies, finds no existing hostname, and creates one", async () => {
    sqlite
      .prepare(
        "INSERT INTO domains (id, user_id, domain, verification_status, verification_token) VALUES ('d2', 'alice', 'links.alice.test', 'pending', 'go2-verify=abc')"
      )
      .run();
    const calls: string[] = [];
    stubCf(calls);

    const res = await json("POST", "/d2/verify");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { verified: boolean; ssl: { status: string } } };
    expect(body.data.verified).toBe(true);
    expect(body.data.ssl.status).toBe("pending_validation");
    // Find-then-create: a GET lookup precedes the POST create.
    expect(calls.some((c) => c.startsWith("GET") && c.includes("hostname="))).toBe(true);
    expect(calls.some((c) => c.startsWith("POST") && c.includes("/custom_hostnames"))).toBe(true);
    const row = sqlite.prepare("SELECT custom_hostname_id, ssl_status FROM domains WHERE id = 'd2'").get();
    expect(row).toEqual({ custom_hostname_id: "ch_new", ssl_status: "pending_validation" });
  });

  it("provisions an already-verified domain that has no hostname id (retry path)", async () => {
    sqlite
      .prepare(
        "INSERT INTO domains (id, user_id, domain, verification_status, verification_token) VALUES ('d4', 'alice', 'old.alice.test', 'verified', 'go2-verify=z')"
      )
      .run();
    const calls: string[] = [];
    stubCf(calls);

    const res = await json("POST", "/d4/verify");
    expect(res.status).toBe(200);
    // Already verified → no DNS re-check, straight to find-then-create.
    expect(calls.some((c) => c.includes("cloudflare-dns.com"))).toBe(false);
    expect(calls.some((c) => c.startsWith("POST") && c.includes("/custom_hostnames"))).toBe(true);
    const row = sqlite.prepare("SELECT custom_hostname_id FROM domains WHERE id = 'd4'").get();
    expect(row).toEqual({ custom_hostname_id: "ch_new" });
  });

  it("adopts an existing hostname instead of creating a duplicate", async () => {
    sqlite
      .prepare(
        "INSERT INTO domains (id, user_id, domain, verification_status, verification_token) VALUES ('d5', 'alice', 'dup.alice.test', 'verified', 'go2-verify=z')"
      )
      .run();
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: { method?: string }) => {
        const method = init?.method ?? "GET";
        calls.push(`${method} ${url}`);
        if (url.includes("hostname=")) {
          return new Response(
            JSON.stringify({
              success: true,
              errors: [],
              result: [{ id: "ch_existing", hostname: "dup.alice.test", status: "active", ssl: { status: "active" } }],
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ success: false, errors: [{ code: 1, message: "should not create" }] }), { status: 400 });
      })
    );

    await json("POST", "/d5/verify");
    expect(calls.some((c) => c.startsWith("POST"))).toBe(false);
    const row = sqlite.prepare("SELECT custom_hostname_id FROM domains WHERE id = 'd5'").get();
    expect(row).toEqual({ custom_hostname_id: "ch_existing" });
  });
});

describe("DELETE /domains/:id cleanup", () => {
  it("deletes the custom hostname and clears the KV mapping", async () => {
    sqlite
      .prepare(
        "INSERT INTO domains (id, user_id, domain, verification_status, verification_token, custom_hostname_id) VALUES ('d1', 'alice', 'shop.alice.test', 'verified', 'go2-verify=tok', 'ch_9')"
      )
      .run();
    kv.set("biohost:shop.alice.test", JSON.stringify({ slug: "me" }));

    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: { method?: string }) => {
        calls.push(`${init?.method} ${url}`);
        return new Response(JSON.stringify({ success: true, errors: [], result: { id: "ch_9" } }), { status: 200 });
      })
    );

    const res = await json("DELETE", "/d1");
    expect(res.status).toBe(204);
    expect(calls).toContain("DELETE https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames/ch_9");
    expect(kv.has("biohost:shop.alice.test")).toBe(false);
    expect(sqlite.prepare("SELECT count(*) AS n FROM domains WHERE id = 'd1'").get()).toEqual({ n: 0 });
  });
});

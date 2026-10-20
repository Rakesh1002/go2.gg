import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./test-d1";

const auth = vi.hoisted(() => ({ userId: "alice" }));

vi.mock("../src/middleware/auth.js", () => ({
  apiKeyAuthMiddleware:
    () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", { id: auth.userId, email: "a@x.test", emailVerified: true });
      await next();
    },
}));

const { links } = await import("../src/routes/v1/links");
const { bulk } = await import("../src/routes/v1/bulk");

let env: { DB: D1Database; DEFAULT_DOMAIN: string; LINKS_KV: KVNamespace };
let sqlite: Awaited<ReturnType<typeof createTestD1>>["sqlite"];

const executionCtx = { waitUntil: () => {}, passThroughOnException: () => {}, props: {} };

beforeEach(async () => {
  auth.userId = "alice";
  const db = await createTestD1();
  sqlite = db.sqlite;
  const kv = new Map<string, string>();
  env = {
    DB: db.d1,
    DEFAULT_DOMAIN: "go2.gg",
    LINKS_KV: {
      get: async (key: string) => kv.get(key) ?? null,
      put: async (key: string, value: string) => void kv.set(key, value),
      delete: async (key: string) => void kv.delete(key),
    } as unknown as KVNamespace,
  };
  sqlite
    .prepare(
      "INSERT INTO domains (id, user_id, domain, verification_status, verification_token) VALUES ('d1', 'mallory', 'victim.example', 'verified', 'tok')"
    )
    .run();
});

function json(method: string, path: string, body: unknown) {
  return links.request(
    path,
    { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env,
    executionCtx
  );
}

function linkCount() {
  return (sqlite.prepare("SELECT count(*) AS n FROM links").get() as { n: number }).n;
}

describe("link domain ownership", () => {
  it("rejects creating a link on another tenant's domain", async () => {
    const res = await json("POST", "/", {
      destinationUrl: "https://example.com",
      slug: "x",
      domain: "victim.example",
    });
    expect(res.status).toBe(403);
    expect(linkCount()).toBe(0);
  });

  it("rejects moving a link onto another tenant's domain", async () => {
    sqlite
      .prepare(
        "INSERT INTO links (id, user_id, slug, destination_url, domain) VALUES ('l1', 'alice', 'x', 'https://example.com', 'go2.gg')"
      )
      .run();
    const res = await json("PATCH", "/l1", { domain: "victim.example" });
    expect(res.status).toBe(403);
    expect(sqlite.prepare("SELECT domain FROM links").get()).toEqual({ domain: "go2.gg" });
  });

  it("refuses bulk-import rows that target another tenant's domain", async () => {
    const res = await bulk.request(
      "/import?format=go2",
      {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: "destinationUrl,slug,domain\nhttps://example.com,x,victim.example\n",
      },
      env
    );
    const body = (await res.json()) as {
      data: { imported: number; errors: Array<{ reason: string }> };
    };
    expect(body.data.imported).toBe(0);
    expect(body.data.errors.map((e) => e.reason).join()).toMatch(/victim\.example/);
    expect(linkCount()).toBe(0);
  });
});

describe("archived slug reclaim", () => {
  function seedArchived(id: string, userId: string, slug: string) {
    sqlite
      .prepare(
        "INSERT INTO links (id, user_id, slug, destination_url, domain, is_archived) VALUES (?, ?, ?, 'https://example.com', 'go2.gg', 1)"
      )
      .run(id, userId, slug);
  }
  const holder = (id: string) => sqlite.prepare("SELECT id FROM links WHERE id = ?").get(id);

  it("never deletes another tenant's archived link to free its slug", async () => {
    seedArchived("a-old", "alice", "taken");
    auth.userId = "bob";
    const create = await json("POST", "/", {
      destinationUrl: "https://example.org",
      slug: "taken",
    });
    expect(create.status).toBe(409);

    sqlite
      .prepare(
        "INSERT INTO links (id, user_id, slug, destination_url, domain) VALUES ('b1', 'bob', 'mine', 'https://example.org', 'go2.gg')"
      )
      .run();
    expect((await json("PATCH", "/b1", { slug: "taken" })).status).toBe(409);
    expect(holder("a-old")).toEqual({ id: "a-old" });
  });

  it("still lets a user reclaim their own archived slug", async () => {
    seedArchived("a-old", "alice", "again");
    const create = await json("POST", "/", {
      destinationUrl: "https://example.org",
      slug: "again",
    });
    expect(create.status).toBe(201);
    expect(holder("a-old")).toBeUndefined();

    seedArchived("a-older", "alice", "rename");
    const { data } = (await create.json()) as { data: { id: string } };
    expect((await json("PATCH", `/${data.id}`, { slug: "rename" })).status).toBe(200);
    expect(holder("a-older")).toBeUndefined();
  });
});

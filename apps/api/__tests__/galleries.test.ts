import type { AuthUser } from "@repo/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./test-d1";

const auth = vi.hoisted(() => ({ user: null as unknown as AuthUser }));

vi.mock("../src/middleware/auth.js", () => ({
  apiKeyAuthMiddleware:
    () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", auth.user);
      await next();
    },
}));

const { galleriesRouter } = await import("../src/routes/v1/galleries");
const { publicGalleries } = await import("../src/routes/v1/public-galleries");

const FREE = {
  id: "free-user",
  email: "f@x.test",
  emailVerified: true,
  organizationId: "org-free",
};
const PRO = { id: "pro-user", email: "p@x.test", emailVerified: true, organizationId: "org-pro" };
const PRO_TEAMMATE = { ...PRO, id: "pro-mate" };

const executionCtx = { waitUntil: () => {}, passThroughOnException: () => {}, props: {} };

let env: { DB: D1Database; DEFAULT_DOMAIN: string };
let sqlite: Awaited<ReturnType<typeof createTestD1>>["sqlite"];

function seedDomain(domain: string, userId: string, orgId: string | null, status: string) {
  sqlite
    .prepare(
      "INSERT INTO domains (id, user_id, organization_id, domain, verification_status, verification_token) VALUES (?, ?, ?, ?, ?, 'tok')"
    )
    .run(crypto.randomUUID(), userId, orgId, domain, status);
}

beforeEach(async () => {
  const db = await createTestD1();
  sqlite = db.sqlite;
  env = { DB: db.d1, DEFAULT_DOMAIN: "go2.gg" };
  sqlite
    .prepare(
      "INSERT INTO subscriptions (id, organization_id, stripe_subscription_id, stripe_price_id, plan, status) VALUES ('sub-1', 'org-pro', 'sub_x', 'price_x', 'pro', 'active')"
    )
    .run();
  seedDomain("free.example", FREE.id, FREE.organizationId, "verified");
  seedDomain("pro.example", PRO.id, PRO.organizationId, "verified");
  seedDomain("pro-pending.example", PRO.id, PRO.organizationId, "pending");
  seedDomain("victim.example", "mallory", "org-victim", "verified");
  // Another tenant's page, which must never count toward anyone else's limit.
  sqlite
    .prepare(
      "INSERT INTO link_galleries (id, user_id, organization_id, slug, domain) VALUES ('g-mallory', 'mallory', 'org-victim', 'm', 'victim.example')"
    )
    .run();
  auth.user = FREE;
});

function call(method: string, path: string, body?: unknown) {
  return galleriesRouter.request(
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

async function createGallery(body: Record<string, unknown>) {
  const res = await call("POST", "/", body);
  return { res, json: (await res.json()) as { data: Record<string, unknown> } };
}

function galleryCount() {
  return (
    sqlite.prepare("SELECT count(*) AS n FROM link_galleries WHERE user_id != 'mallory'").get() as {
      n: number;
    }
  ).n;
}

describe("bio page plan limits", () => {
  it("lets a free user create one bio page", async () => {
    expect((await createGallery({ slug: "one" })).res.status).toBe(201);
    expect((await createGallery({ slug: "two" })).res.status).toBe(402);
    expect(galleryCount()).toBe(1);
  });

  it("lets a pro organization create three, counted across members", async () => {
    auth.user = PRO;
    for (const slug of ["a", "b", "c"]) {
      expect((await createGallery({ slug })).res.status).toBe(201);
    }
    auth.user = PRO_TEAMMATE;
    expect((await createGallery({ slug: "d" })).res.status).toBe(402);
  });

  it("does not let concurrent creates overshoot the limit", async () => {
    const results = await Promise.all(["p", "q", "r", "s"].map((slug) => createGallery({ slug })));
    expect(results.map((r) => r.res.status).sort()).toEqual([201, 402, 402, 402]);
    expect(galleryCount()).toBe(1);
  });

  it("does not grant a fresh free page per extra organization", async () => {
    expect((await createGallery({ slug: "first" })).res.status).toBe(201);
    auth.user = { ...FREE, organizationId: "org-free-2" };
    expect((await createGallery({ slug: "second" })).res.status).toBe(402);
    auth.user = { ...FREE, organizationId: undefined };
    expect((await createGallery({ slug: "third" })).res.status).toBe(402);
    expect(galleryCount()).toBe(1);
  });
});

describe("domain ownership", () => {
  it("rejects creating a bio page on another tenant's domain", async () => {
    const { res } = await createGallery({ slug: "hijack", domain: "victim.example" });
    expect(res.status).toBe(403);
    expect(galleryCount()).toBe(0);
  });

  it("allows the user's own custom domain", async () => {
    expect((await createGallery({ slug: "mine", domain: "free.example" })).res.status).toBe(201);
  });

  it("rejects moving a bio page onto another tenant's domain", async () => {
    const { json } = await createGallery({ slug: "mine" });
    const res = await call("PATCH", `/${json.data.id}`, { domain: "victim.example" });
    expect(res.status).toBe(403);
    expect(
      sqlite.prepare("SELECT domain FROM link_galleries WHERE id = ?").get(json.data.id)
    ).toEqual({
      domain: "go2.gg",
    });
  });

  it("returns 409 when a domain-only move collides with an existing slug", async () => {
    auth.user = PRO;
    const { json } = await createGallery({ slug: "same" });
    await createGallery({ slug: "same", domain: "pro.example" });
    const res = await call("PATCH", `/${json.data.id}`, { domain: "pro.example" });
    expect(res.status).toBe(409);
  });
});

describe("18+ mode", () => {
  it("is refused on the free plan even on a verified own domain", async () => {
    const { res } = await createGallery({ slug: "x", domain: "free.example", isSensitive: true });
    expect(res.status).toBe(403);
  });

  it("is refused for pro on the shared platform domain", async () => {
    auth.user = PRO;
    expect((await createGallery({ slug: "x", isSensitive: true })).res.status).toBe(403);
  });

  it("is refused for pro on an unverified own domain", async () => {
    auth.user = PRO;
    const { res } = await createGallery({
      slug: "x",
      domain: "pro-pending.example",
      isSensitive: true,
    });
    expect(res.status).toBe(403);
  });

  it("is allowed for pro on a verified own domain", async () => {
    auth.user = PRO;
    const { res, json } = await createGallery({
      slug: "x",
      domain: "pro.example",
      isSensitive: true,
    });
    expect(res.status).toBe(201);
    expect(json.data.isSensitive).toBe(true);
  });

  it("refuses moving a sensitive page off a qualifying domain", async () => {
    auth.user = PRO;
    const { json } = await createGallery({ slug: "x", domain: "pro.example", isSensitive: true });
    expect((await call("PATCH", `/${json.data.id}`, { domain: "go2.gg" })).status).toBe(403);
    expect(
      (await call("PATCH", `/${json.data.id}`, { domain: "pro-pending.example" })).status
    ).toBe(403);
  });

  it("refuses enabling 18+ on an existing page on the platform domain", async () => {
    auth.user = PRO;
    const { json } = await createGallery({ slug: "x" });
    expect((await call("PATCH", `/${json.data.id}`, { isSensitive: true })).status).toBe(403);
  });

  it("requires 18+ mode for adult links and social links", async () => {
    auth.user = PRO;
    const plain = (await createGallery({ slug: "plain", domain: "pro.example" })).json.data;
    const adultLink = { type: "link", title: "OF", url: "https://onlyfans.com/me" };

    expect((await call("POST", `/${plain.id}/items`, adultLink)).status).toBe(403);

    const safe = (await (
      await call("POST", `/${plain.id}/items`, { type: "link", url: "https://example.com" })
    ).json()) as { data: { id: string } };
    expect(
      (await call("PATCH", `/${plain.id}/items/${safe.data.id}`, { url: "https://fansly.com/me" }))
        .status
    ).toBe(403);

    expect(
      (
        await call("PATCH", `/${plain.id}`, {
          socialLinks: [{ platform: "onlyfans", url: "https://onlyfans.com/me" }],
        })
      ).status
    ).toBe(403);
    expect(
      (
        await createGallery({
          slug: "social",
          socialLinks: [{ platform: "onlyfans", url: "https://www.onlyfans.com/me" }],
        })
      ).res.status
    ).toBe(403);

    const adult = (await createGallery({ slug: "adult", domain: "pro.example", isSensitive: true }))
      .json.data;
    expect((await call("POST", `/${adult.id}/items`, adultLink)).status).toBe(201);
  });

  it("refuses turning 18+ off while adult links remain", async () => {
    auth.user = PRO;
    const adult = (
      await createGallery({
        slug: "adult",
        domain: "pro.example",
        isSensitive: true,
        socialLinks: [{ platform: "onlyfans", url: "https://onlyfans.com/me" }],
      })
    ).json.data;
    expect((await call("PATCH", `/${adult.id}`, { isSensitive: false })).status).toBe(403);

    const res = await call("PATCH", `/${adult.id}`, { isSensitive: false, socialLinks: [] });
    expect(res.status).toBe(200);

    await call("PATCH", `/${adult.id}`, { isSensitive: true });
    await call("POST", `/${adult.id}/items`, { type: "link", url: "https://onlyfans.com/me" });
    expect((await call("PATCH", `/${adult.id}`, { isSensitive: false })).status).toBe(403);
  });
});

describe("item reorder", () => {
  it("reaches the reorder handler instead of the item update route", async () => {
    const { json } = await createGallery({ slug: "r" });
    const id = json.data.id;
    const first = (await (
      await call("POST", `/${id}/items`, { type: "header", title: "first" })
    ).json()) as { data: { id: string } };
    const second = (await (
      await call("POST", `/${id}/items`, { type: "header", title: "second" })
    ).json()) as { data: { id: string } };

    const res = await call("PATCH", `/${id}/items/reorder`, {
      items: [
        { id: first.data.id, position: 1 },
        { id: second.data.id, position: 0 },
      ],
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ title: string }> };
    expect(body.data.map((item) => item.title)).toEqual(["second", "first"]);
  });
});

describe("public payload", () => {
  it("exposes isSensitive", async () => {
    auth.user = PRO;
    await createGallery({
      slug: "pub",
      domain: "pro.example",
      isSensitive: true,
      isPublished: true,
    });

    const res = await publicGalleries.request("/pro.example/pub", {}, env, executionCtx);
    const body = (await res.json()) as { data: { isSensitive: boolean } };
    expect(body.data.isSensitive).toBe(true);
  });
});

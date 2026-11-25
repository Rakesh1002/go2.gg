import type { DatabaseSync } from "node:sqlite";
import * as schema from "@repo/db";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rescanLinkBatch } from "../src/lib/threat-rescan";
import { createTestD1 } from "./test-d1";

// D1 rejects a query with more than 100 bound parameters; the test D1 does not.
const D1_MAX_PARAMS = 100;

describe("rescanLinkBatch", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let sqlite: DatabaseSync;
  let listed: Map<string, string>;
  let sbDown: boolean;
  const kv = new Map<string, string>();
  const env = {
    GOOGLE_SAFE_BROWSING_API_KEY: "test",
    APP_ENV: "test",
    APP_URL: "https://app.test",
    LINKS_KV: {
      get: async (k: string) => (kv.has(k) ? JSON.parse(kv.get(k) as string) : null),
      put: async (k: string, v: string) => void kv.set(k, v),
    },
    KV_CONFIG: { get: async () => null },
    BACKGROUND_QUEUE: { send: async () => undefined },
  } as never;

  beforeEach(async () => {
    const test = await createTestD1();
    sqlite = test.sqlite;
    const prepare = test.d1.prepare;
    test.d1.prepare = ((query: string) => {
      const stmt = prepare(query);
      return {
        ...stmt,
        bind: (...params: never[]) => {
          if (params.length > D1_MAX_PARAMS)
            throw new Error(`too many SQL variables (${params.length})`);
          return stmt.bind(...params);
        },
      };
    }) as typeof prepare;
    db = drizzle(test.d1, { schema });
    listed = new Map();
    sbDown = false;
    kv.clear();
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      if (!String(url).startsWith("https://safebrowsing.googleapis.com")) {
        return new Response("", { status: 500 });
      }
      if (sbDown) return new Response("", { status: 503 });
      const entries: string[] = JSON.parse(init.body).threatInfo.threatEntries.map(
        (e: { url: string }) => e.url
      );
      const matches = entries
        .filter((u) => listed.has(u))
        .map((u) => ({ threatType: listed.get(u), threat: { url: u } }));
      return Response.json(matches.length ? { matches } : {});
    });
  });

  let n = 0;
  const seed = (userId: string | null, opts: { slug?: string; dest?: string } = {}) => {
    const id = `l${++n}`;
    const slug = opts.slug ?? id;
    sqlite
      .prepare(
        "INSERT INTO links (id, user_id, domain, slug, destination_url, is_archived, is_disabled, threat_status, threat_last_checked) VALUES (?, ?, 'go2.gg', ?, ?, 0, 0, 'clean', ?)"
      )
      .run(id, userId, slug, opts.dest ?? `https://ok.example/${id}`, new Date().toISOString());
    kv.set(`go2.gg:${slug}`, JSON.stringify({ id, domain: "go2.gg", slug, isDisabled: false }));
    return id;
  };
  const row = (id: string) =>
    sqlite.prepare("SELECT * FROM links WHERE id = ?").get(id) as Record<string, unknown>;
  const banned = (userId: string) =>
    (
      sqlite.prepare("SELECT is_banned FROM user_metadata WHERE user_id = ?").get(userId) as
        | { is_banned: number }
        | undefined
    )?.is_banned === 1;

  it("disables a listed short URL whose destination reads clean, at the edge too", async () => {
    const scanit = seed("u1", { slug: "scanit", dest: "https://scan.page/uH1GlT" });
    const sibling = seed("u1");
    listed.set("https://go2.gg/scanit", "SOCIAL_ENGINEERING");

    const result = await rescanLinkBatch(env, db);

    expect(row(scanit)).toMatchObject({
      is_disabled: 1,
      disabled_reason: "safe_browsing:SOCIAL_ENGINEERING",
      threat_status: "flagged",
    });
    expect(JSON.parse(kv.get("go2.gg:scanit") as string).isDisabled).toBe(true);
    // First flag re-checks the owner's other links in the same run.
    expect(row(sibling).is_disabled).toBe(0);
    expect(result).toMatchObject({ flagged: 1, suspended: 0, scanned: 1 });
    expect(banned("u1")).toBe(false);
  });

  it("never pins a whole-domain listing on individual links", async () => {
    const a = seed("u1", { slug: "a" });
    listed.set("https://go2.gg/", "SOCIAL_ENGINEERING");
    listed.set("https://go2.gg/a", "SOCIAL_ENGINEERING");

    await rescanLinkBatch(env, db);

    expect(row(a).is_disabled).toBe(0);
  });

  it("disables nothing when Safe Browsing is down", async () => {
    const a = seed("u1", { slug: "a" });
    listed.set("https://go2.gg/a", "SOCIAL_ENGINEERING");
    sbDown = true;

    await rescanLinkBatch(env, db);

    expect(row(a).is_disabled).toBe(0);
  });

  it("suspends on a second Safe Browsing flag even after the first link was repointed", async () => {
    const a = seed("u1", { slug: "a" });
    const b = seed("u1", { slug: "b" });
    const innocent = seed("u2", { slug: "c" });
    listed.set("https://go2.gg/a", "SOCIAL_ENGINEERING");
    await rescanLinkBatch(env, db);

    // What PATCH /links/:id writes when the owner points the dead link somewhere clean.
    sqlite.prepare("UPDATE links SET threat_status = 'clean' WHERE id = ?").run(a);
    listed.clear();
    listed.set("https://go2.gg/b", "SOCIAL_ENGINEERING");
    const result = await rescanLinkBatch(env, db);

    expect(result.suspended).toBe(1);
    expect(banned("u1")).toBe(true);
    expect(row(b).is_disabled).toBe(1);
    expect(banned("u2")).toBe(false);
    expect(row(innocent).is_disabled).toBe(0);
  });

  it("does not suspend on flags that are not Safe Browsing verdicts", async () => {
    const a = seed("u1", { dest: "https://paypal.com.secure-login.io/account" });
    const b = seed("u1", { dest: "https://roblox.com.ge/games/1/x" });
    sqlite.prepare("UPDATE links SET threat_last_checked = NULL").run();

    const result = await rescanLinkBatch(env, db);

    expect(row(a).is_disabled).toBe(1);
    expect(row(b).is_disabled).toBe(1);
    expect(result.suspended).toBe(0);
    expect(banned("u1")).toBe(false);
  });

  it("re-checks an owner with more siblings than D1's bound-parameter cap", async () => {
    seed("u1", { slug: "scanit" });
    const siblings = Array.from({ length: D1_MAX_PARAMS + 20 }, () => seed("u1"));
    listed.set("https://go2.gg/scanit", "SOCIAL_ENGINEERING");

    const result = await rescanLinkBatch(env, db);

    expect(result.scanned).toBe(siblings.length);
    expect(row(siblings[0]).threat_last_checked).not.toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./test-d1";

vi.mock("../src/middleware/auth.js", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiKeyAuthMiddleware:
    () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", { id: "alice", email: "a@x.test", emailVerified: true });
      await next();
    },
}));

const { links } = await import("../src/routes/v1/links");
const { default: worker } = await import("../src/index");

let pending: Promise<unknown>[] = [];
const executionCtx = {
  waitUntil(p: Promise<unknown>) {
    pending.push(Promise.resolve(p).catch(() => {}));
  },
  passThroughOnException() {},
  props: {},
} as unknown as ExecutionContext;

let kv: Map<string, string>;
let env: Record<string, unknown>;
let sqlite: Awaited<ReturnType<typeof createTestD1>>["sqlite"];

beforeEach(async () => {
  const db = await createTestD1();
  sqlite = db.sqlite;
  pending = [];
  kv = new Map();
  const linksKv = {
    get: async (key: string, opts?: unknown) => {
      const raw = kv.get(key) ?? null;
      const wantsJson = opts === "json" || (opts as { type?: string } | undefined)?.type === "json";
      return raw && wantsJson ? JSON.parse(raw) : raw;
    },
    put: async (key: string, value: string) => void kv.set(key, value),
    delete: async (key: string) => void kv.delete(key),
  };
  env = new Proxy(
    {
      DB: db.d1,
      DEFAULT_DOMAIN: "go2.gg",
      ENVIRONMENT: "test",
      LINKS_KV: linksKv,
      TRACKER: { writeDataPoint() {} },
    } as Record<string, unknown>,
    { get: (t, p: string) => (p in t ? t[p] : undefined) }
  );
});

function api(method: string, path: string, body: unknown) {
  return links.request(
    path,
    { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env,
    executionCtx
  );
}

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function redirectParams(slug: string) {
  const res = await worker.fetch(
    new Request(`https://go2.gg/${slug}`, {
      headers: { host: "go2.gg", "sec-fetch-mode": "navigate", "user-agent": CHROME_UA },
    }),
    env as never,
    executionCtx
  );
  expect(res.status).toBe(302);
  return new URL(res.headers.get("location") ?? "").searchParams;
}

describe("link UTM fields reach the redirect", () => {
  it("writes UTM fields set at creation into the KV record and the redirect URL", async () => {
    const create = await api("POST", "/", {
      destinationUrl: "https://agentdrive.sh/?ref=hero",
      slug: "utm-launch",
      utmSource: "producthunt",
      utmMedium: "launch",
      utmCampaign: "launch-2026-11",
    });
    expect(create.status).toBe(201);

    expect(JSON.parse(kv.get("go2.gg:utm-launch") ?? "{}")).toMatchObject({
      utmSource: "producthunt",
      utmMedium: "launch",
      utmCampaign: "launch-2026-11",
    });

    const params = await redirectParams("utm-launch");
    expect(params.get("ref")).toBe("hero");
    expect(params.get("utm_source")).toBe("producthunt");
    expect(params.get("utm_medium")).toBe("launch");
    expect(params.get("utm_campaign")).toBe("launch-2026-11");
    expect(params.has("utm_term")).toBe(false);
    expect(params.get("go2_ref")).toMatch(/:/);
  });

  it("re-syncs UTM changes from an update into the redirect", async () => {
    const create = await api("POST", "/", {
      destinationUrl: "https://agentdrive.sh",
      slug: "utm-edit",
      utmSource: "x",
    });
    const { data } = (await create.json()) as { data: { id: string } };

    expect((await api("PATCH", `/${data.id}`, { utmSource: "", utmContent: "v2" })).status).toBe(
      200
    );

    const params = await redirectParams("utm-edit");
    expect(params.has("utm_source")).toBe(false);
    expect(params.get("utm_content")).toBe("v2");
  });

  it("clears UTM fields when an update sends null, as the dashboard edit form does", async () => {
    const create = await api("POST", "/", {
      destinationUrl: "https://agentdrive.sh",
      slug: "utm-clear",
      utmSource: "x",
      utmMedium: "social",
      utmCampaign: "launch",
      utmTerm: "t",
      utmContent: "c",
    });
    const { data } = (await create.json()) as { data: { id: string } };

    const update = await api("PATCH", `/${data.id}`, {
      destinationUrl: "https://agentdrive.sh",
      slug: "utm-clear",
      title: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      trackingPixels: [],
      clearTrackingPixels: true,
      enablePixelTracking: false,
      requirePixelConsent: false,
    });
    expect(update.status).toBe(200);

    expect(
      sqlite
        .prepare(
          "SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content FROM links WHERE id = ?"
        )
        .get(data.id)
    ).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    });
    const params = await redirectParams("utm-clear");
    expect([...params.keys()].filter((k) => k.startsWith("utm_"))).toEqual([]);
  });

  it("records the UTMs the redirect sent on the click, destination params winning", async () => {
    await api("POST", "/", {
      destinationUrl: "https://agentdrive.sh/?utm_medium=email",
      slug: "utm-click",
      utmSource: "producthunt",
      utmMedium: "launch",
      utmCampaign: "launch-2026-11",
    });
    await redirectParams("utm-click");
    await Promise.all(pending);

    expect(
      sqlite.prepare("SELECT utm_source, utm_medium, utm_campaign, utm_term FROM clicks").all()
    ).toEqual([
      {
        utm_source: "producthunt",
        utm_medium: "email",
        utm_campaign: "launch-2026-11",
        utm_term: null,
      },
    ]);
  });
});

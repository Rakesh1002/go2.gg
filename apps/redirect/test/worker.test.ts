import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

async function seed(key: string, value: unknown) {
  await env.LINKS_KV.put(key, JSON.stringify(value));
}

const opts = { redirect: "manual" as const, headers: { host: "go2.gg" } };

beforeEach(async () => {
  // miniflare KV persists across tests in a run; clear the keys we use.
  for (const k of [
    "go2.gg:simple",
    "go2.gg:disabled",
    "go2.gg:miss",
    "biohost:links.creator.com",
    "biohost:go2.gg",
  ]) {
    await env.LINKS_KV.delete(k);
  }
});

describe("go2-redirect worker", () => {
  it("serves a simple link as a native 302 with go2_ref + Server-Timing", async () => {
    await seed("go2.gg:simple", {
      id: "lnk_1",
      slug: "simple",
      domain: "go2.gg",
      destinationUrl: "https://youtu.be/abc",
    });
    const res = await SELF.fetch("https://go2.gg/simple", opts);
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toContain("https://youtu.be/abc");
    expect(loc).toContain("go2_ref=lnk_1%3A");
    expect(res.headers.get("server-timing")).toContain("total;dur=");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("forwards a disabled link to the monolith (renders the 410 page there)", async () => {
    await seed("go2.gg:disabled", {
      id: "lnk_2",
      slug: "disabled",
      domain: "go2.gg",
      destinationUrl: "https://evil.test",
      isDisabled: true,
    });
    const res = await SELF.fetch("https://go2.gg/disabled", opts);
    expect(res.headers.get("x-mock")).toBe("api");
    expect(await res.text()).toContain("FORWARDED");
  });

  it("forwards a KV miss to the monolith (D1 rehydrate)", async () => {
    const res = await SELF.fetch("https://go2.gg/miss", opts);
    expect(res.headers.get("x-mock")).toBe("api");
  });

  it("forwards a reserved web path (pricing) to the monolith", async () => {
    const res = await SELF.fetch("https://go2.gg/pricing", opts);
    expect(res.headers.get("x-mock")).toBe("api");
  });

  it("forwards a non-GET method to the monolith", async () => {
    const res = await SELF.fetch("https://go2.gg/simple", { method: "POST", headers: { host: "go2.gg" } });
    expect(res.headers.get("x-mock")).toBe("api");
  });

  it("rewrites a custom-domain root to its bound bio gallery + tags the domain", async () => {
    await seed("biohost:links.creator.com", { slug: "me" });
    const res = await SELF.fetch("https://links.creator.com/", {
      redirect: "manual",
      headers: { host: "links.creator.com" },
    });
    expect(res.headers.get("x-mock")).toBe("api");
    expect(await res.text()).toBe("FORWARDED /bio/me");
    expect(res.headers.get("x-bio-domain")).toBe("links.creator.com");
  });

  it("forwards a bio-host asset to the web app, tagged, without rewriting the path", async () => {
    await seed("biohost:links.creator.com", { slug: "me" });
    const res = await SELF.fetch("https://links.creator.com/_next/static/chunks/main.js", {
      redirect: "manual",
      headers: { host: "links.creator.com" },
    });
    expect(await res.text()).toBe("FORWARDED /_next/static/chunks/main.js");
    expect(res.headers.get("x-bio-domain")).toBe("links.creator.com");
  });

  it("leaves ACME challenge paths on a bio host untouched (edge-served)", async () => {
    await seed("biohost:links.creator.com", { slug: "me" });
    const res = await SELF.fetch("https://links.creator.com/.well-known/acme-challenge/tok", {
      redirect: "manual",
      headers: { host: "links.creator.com" },
    });
    expect(await res.text()).toBe("FORWARDED /.well-known/acme-challenge/tok");
    expect(res.headers.get("x-bio-domain")).toBe("");
  });

  it("forwards a custom-domain root with no bio mapping unchanged", async () => {
    const res = await SELF.fetch("https://other.creator.com/", {
      redirect: "manual",
      headers: { host: "other.creator.com" },
    });
    expect(await res.text()).toBe("FORWARDED /");
    expect(res.headers.get("x-bio-domain")).toBe("");
  });

  it("does not treat the platform apex root as a bio domain", async () => {
    await seed("biohost:go2.gg", { slug: "x" });
    const res = await SELF.fetch("https://go2.gg/", { redirect: "manual", headers: { host: "go2.gg" } });
    expect(await res.text()).toBe("FORWARDED /");
    expect(res.headers.get("x-bio-domain")).toBe("");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkSafeBrowsing, lookupSafeBrowsing } from "../src/lib/safe-browsing";

const env = { GOOGLE_SAFE_BROWSING_API_KEY: "test", APP_ENV: "test" } as never;

describe("Safe Browsing lookup", () => {
  let respond: (entries: string[]) => Response;

  beforeEach(() => {
    vi.stubGlobal("fetch", async (_url: string, init: { body: string }) =>
      respond(JSON.parse(init.body).threatInfo.threatEntries.map((e: { url: string }) => e.url))
    );
  });

  it("keys blocking threats by the URL as sent and drops non-blocking ones", async () => {
    respond = () =>
      Response.json({
        matches: [
          { threatType: "SOCIAL_ENGINEERING", threat: { url: "https://go2.gg/a" } },
          { threatType: "MALWARE", threat: { url: "https://go2.gg/a" } },
          { threatType: "THREAT_TYPE_UNSPECIFIED", threat: { url: "https://go2.gg/b" } },
        ],
      });

    const listed = await lookupSafeBrowsing(env, ["https://go2.gg/a", "https://go2.gg/b"]);

    expect(listed).toEqual(new Map([["https://go2.gg/a", ["SOCIAL_ENGINEERING", "MALWARE"]]]));
  });

  it("returns null when the upstream errors, so callers treat it as unknown", async () => {
    respond = () => new Response("", { status: 503 });
    expect(await lookupSafeBrowsing(env, ["https://go2.gg/a"])).toBeNull();
    expect(await checkSafeBrowsing(env, "https://go2.gg/a")).toBeNull();
  });

  it("keeps the single-URL check's shape, even when a match omits threat.url", async () => {
    respond = ([url]) =>
      Response.json(url === "https://bad.example/" ? { matches: [{ threatType: "MALWARE" }] } : {});

    expect(await checkSafeBrowsing(env, "https://bad.example/")).toEqual({
      flagged: true,
      threats: ["MALWARE"],
    });
    expect(await checkSafeBrowsing(env, "https://ok.example/")).toEqual({
      flagged: false,
      threats: [],
    });
  });
});

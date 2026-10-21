import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCustomHostname,
  deleteCustomHostname,
  getCustomHostname,
} from "../src/lib/cf-for-saas";

const env = { CLOUDFLARE_ZONE_ID: "zone1", CLOUDFLARE_SAAS_TOKEN: "tok1" };

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createCustomHostname", () => {
  it("posts to the zone and normalizes the ssl + validation records", async () => {
    const fetchSpy = mockFetch(200, {
      success: true,
      errors: [],
      result: {
        id: "ch_1",
        hostname: "links.creator.com",
        status: "pending",
        ssl: {
          status: "pending_validation",
          validation_records: [{ txt_name: "_cf.links.creator.com", txt_value: "abc" }],
        },
        ownership_verification: { type: "txt", name: "_own.links.creator.com", value: "xyz" },
      },
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createCustomHostname(env, "links.creator.com");

    expect(result.id).toBe("ch_1");
    expect(result.sslStatus).toBe("pending_validation");
    expect(result.validationRecords).toEqual([
      { type: "TXT", name: "_cf.links.creator.com", value: "abc" },
      { type: "TXT", name: "_own.links.creator.com", value: "xyz" },
    ]);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok1");
    expect(JSON.parse(init.body as string).ssl.method).toBe("http");
  });

  it("throws a descriptive error when the API returns success:false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(400, { success: false, errors: [{ code: 1234, message: "bad hostname" }], result: null })
    );
    await expect(createCustomHostname(env, "bad")).rejects.toThrow(/1234: bad hostname/);
  });

  it("throws when the zone/token are not configured", async () => {
    await expect(createCustomHostname({}, "links.creator.com")).rejects.toThrow(/not configured/);
  });
});

describe("getCustomHostname", () => {
  it("GETs the hostname by id", async () => {
    const fetchSpy = mockFetch(200, {
      success: true,
      errors: [],
      result: { id: "ch_1", hostname: "links.creator.com", status: "active", ssl: { status: "active" } },
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getCustomHostname(env, "ch_1");
    expect(result.status).toBe("active");
    expect(result.sslStatus).toBe("active");
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames/ch_1"
    );
  });
});

describe("deleteCustomHostname", () => {
  it("swallows an already-deleted (404) hostname", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(404, { success: false, errors: [{ code: 81057, message: "not found" }], result: null })
    );
    await expect(deleteCustomHostname(env, "ch_gone")).resolves.toBeUndefined();
  });

  it("rethrows other API errors", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(500, { success: false, errors: [{ code: 1000, message: "boom" }], result: null })
    );
    await expect(deleteCustomHostname(env, "ch_1")).rejects.toThrow(/boom/);
  });
});

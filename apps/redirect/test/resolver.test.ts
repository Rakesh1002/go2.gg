import { describe, expect, it } from "vitest";
import { evaluateLink, type LinkGateInput } from "@repo/link-resolver";

const NOW = Date.parse("2026-06-18T12:00:00Z");
const base: LinkGateInput = { destinationUrl: "https://example.com" };

describe("evaluateLink — native fast path", () => {
  it("serves a plain link natively", () => {
    expect(evaluateLink(base, NOW)).toEqual({
      action: "redirect",
      destination: "https://example.com",
    });
  });

  it("serves a link with a future expiry natively", () => {
    expect(evaluateLink({ ...base, expiresAt: "2099-01-01T00:00:00Z" }, NOW).action).toBe("redirect");
  });

  it("serves a link with a future policy expiry natively", () => {
    expect(
      evaluateLink({ ...base, policyExpiresAt: "2099-01-01T00:00:00Z" }, NOW).action
    ).toBe("redirect");
  });

  it("ignores an unparseable expiry rather than 410-ing a live link", () => {
    expect(evaluateLink({ ...base, expiresAt: "not-a-date" }, NOW).action).toBe("redirect");
  });
});

describe("evaluateLink — forward gates (safety-critical)", () => {
  const cases: Array<[string, LinkGateInput, string]> = [
    ["archived", { ...base, isArchived: true }, "archived"],
    ["disabled", { ...base, isDisabled: true }, "disabled"],
    ["expired", { ...base, expiresAt: "2020-01-01T00:00:00Z" }, "expired"],
    ["policy expired", { ...base, policyExpiresAt: "2020-01-01T00:00:00Z" }, "policy_expired"],
    ["click limit", { ...base, clickLimit: 100 }, "click_limit"],
    ["password", { ...base, passwordHash: "h" }, "password"],
    ["rewrite/cloak", { ...base, rewrite: true }, "rewrite"],
    ["pixels", { ...base, enablePixelTracking: true, trackingPixels: [{}] }, "pixels"],
    ["ab test", { ...base, abTestId: "ab1" }, "ab_test"],
    ["og meta", { ...base, ogTitle: "t" }, "og_meta"],
    ["ios target", { ...base, iosUrl: "app://x" }, "targeting"],
    ["android target", { ...base, androidUrl: "app://x" }, "targeting"],
    ["geo target", { ...base, geoTargets: { US: "https://us.example.com" } }, "targeting"],
    ["device target", { ...base, deviceTargets: { mobile: "https://m.example.com" } }, "targeting"],
  ];
  for (const [name, link, reason] of cases) {
    it(`forwards ${name}`, () => {
      expect(evaluateLink(link, NOW)).toEqual({ action: "forward", reason });
    });
  }

  it("does NOT forward when pixels exist but tracking is disabled", () => {
    expect(evaluateLink({ ...base, enablePixelTracking: false, trackingPixels: [{}] }, NOW).action).toBe("redirect");
  });

  it("does NOT forward on empty geo/device target maps", () => {
    expect(evaluateLink({ ...base, geoTargets: {}, deviceTargets: {} }, NOW).action).toBe("redirect");
  });

  it("disabled wins over a clean destination (order: safety first)", () => {
    expect(evaluateLink({ ...base, isDisabled: true, isArchived: false }, NOW)).toEqual({
      action: "forward",
      reason: "disabled",
    });
  });
});

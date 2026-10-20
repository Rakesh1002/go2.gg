import { describe, expect, it } from "vitest";
import type { TrackingPixel } from "../src/bindings";
import { generatePixelTrackingPage } from "../src/lib/pixel-tracking";

const PAYLOAD =
  "x');alert(document.domain);//</script><script>alert(1)</script>\"><img src=x onerror=alert(2)>";
const TYPES = ["facebook", "google", "ga4", "linkedin", "tiktok", "twitter", "pinterest"] as const;

const literal = (value: string) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function scriptsOf(html: string): string[] {
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

describe("generatePixelTrackingPage", () => {
  it.each(TYPES)("keeps a hostile %s pixelId and event inside string literals", (type) => {
    const pixel: TrackingPixel = { type, pixelId: PAYLOAD, enabled: true, events: [PAYLOAD] };
    for (const requireConsent of [false, true]) {
      const html = generatePixelTrackingPage("https://example.com/", [pixel], { requireConsent });
      expect(html).not.toContain("<img src=x");
      expect(html).not.toContain("</script><script>alert(1)");
      for (const body of scriptsOf(html)) {
        expect(() => new Function(body)).not.toThrow();
        // Once the escaped copies are removed, none of the payload may be left as code.
        const rest = body
          .replaceAll(literal(PAYLOAD), "")
          .replaceAll(encodeURIComponent(PAYLOAD), "");
        expect(rest).not.toContain("alert");
      }
    }
  });

  it("escapes the destination in script, attribute and refresh contexts", () => {
    const destination = "https://example.com/');alert(1);//\"><script>alert(2)</script>";
    const html = generatePixelTrackingPage(destination, [
      { type: "facebook", pixelId: "123", enabled: true },
    ]);
    expect(html).not.toContain("<script>alert(2)");
    for (const body of scriptsOf(html)) {
      expect(() => new Function(body)).not.toThrow();
      expect(body.replaceAll(literal(destination), "")).not.toContain("alert");
    }
  });

  it.each([
    "123456",
    "</script><script>alert(1)</script>",
    "`;alert(1);`",
    "${alert(1)}",
    "x\n');alert(1);//",
    "x\u2028alert(1)",
    "x\u2029alert(1)",
  ])("emits parseable consent-mode JS for pixelId %j", (pixelId) => {
    const pixels: TrackingPixel[] = TYPES.map((type) => ({
      type,
      pixelId,
      enabled: true,
      events: [pixelId],
    }));
    const html = generatePixelTrackingPage("https://example.com/", pixels, {
      requireConsent: true,
    });
    expect(html).toContain("function loadPixels()");
    expect(html).not.toContain("<script>alert(1)");
    for (const body of scriptsOf(html)) {
      expect(() => new Function(body)).not.toThrow();
      const rest = body
        .replaceAll(literal(pixelId), "")
        .replaceAll(encodeURIComponent(pixelId), "");
      expect(rest).not.toContain("alert");
    }
  });

  it("still emits working tags for ordinary ids", () => {
    const html = generatePixelTrackingPage("https://example.com/", [
      { type: "facebook", pixelId: "1234567890", enabled: true, events: ["PageView", "Lead"] },
    ]);
    expect(html).toContain(`fbq('init', "1234567890")`);
    expect(html).toContain(`fbq('track', "Lead")`);
    expect(html).toContain("https://www.facebook.com/tr?id=1234567890&ev=PageView");
  });
});

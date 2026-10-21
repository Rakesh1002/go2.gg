import { describe, expect, it } from "vitest";
import { generateCloakedPage } from "../src/lib/cloaked-page";

describe("generateCloakedPage", () => {
  it("embeds the destination in the iframe and the fallback link", () => {
    const html = generateCloakedPage("https://flirtly.co/");
    expect(html).toContain('id="frame"');
    expect(html).toContain('src="https://flirtly.co/"');
    // The error-fallback "Continue to destination" link points at the real URL.
    expect(html).toContain('href="https://flirtly.co/"');
    // Default title falls back to the destination hostname.
    expect(html).toContain("<title>flirtly.co</title>");
  });

  it("escapes a hostile destination so it cannot break out of the src attribute", () => {
    // The API only stores valid http(s) URLs, but the generator must stay safe
    // regardless of what reaches it.
    const hostile = 'https://evil.test/"></iframe><script>alert(1)</script>';
    const html = generateCloakedPage(hostile);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain('"></iframe>');
    expect(html).toContain("&quot;&gt;&lt;/iframe&gt;&lt;script&gt;");
  });

  it("escapes OG metadata overrides", () => {
    const html = generateCloakedPage("https://flirtly.co/", {
      title: '<script>alert(1)</script>',
      description: 'desc"><img src=x onerror=alert(2)>',
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
  });
});

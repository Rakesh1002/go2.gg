import assert from "node:assert/strict";
import { test } from "node:test";
import { isLinkPreviewBot, wantsOgPreview } from "../src/lib/og-preview.ts";

test("real browser navigation gets the instant redirect (no OG page)", () => {
  // Modern browsers send Sec-Fetch-Mode: navigate on a top-level navigation.
  assert.equal(wantsOgPreview("Mozilla/5.0 ... Chrome/120 Safari/537.36", "navigate"), false);
});

test("requests without a navigation signal are treated as crawlers (e.g. OrcaScan, curl, unfurlers)", () => {
  assert.equal(wantsOgPreview("OrcaScan-OpenGraph-Validator", undefined), true);
  assert.equal(wantsOgPreview("curl/8.4.0", ""), true);
  assert.equal(wantsOgPreview("Mozilla/5.0 (old browser, no sec-fetch)", undefined), true);
});

test("a known preview bot always gets OG, even if it claims to navigate", () => {
  assert.equal(wantsOgPreview("facebookexternalhit/1.1", "navigate"), true);
});

test("isLinkPreviewBot matches the messaging-app crawlers we care about", () => {
  for (const ua of [
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "WhatsApp/2.23",
    "Slackbot-LinkExpanding 1.0",
    "Mozilla/5.0 (compatible; Discordbot/2.0)",
  ]) {
    assert.equal(isLinkPreviewBot(ua), true, `expected bot: ${ua}`);
  }
});

test("isLinkPreviewBot does not match a normal browser", () => {
  assert.equal(
    isLinkPreviewBot(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    ),
    false
  );
});

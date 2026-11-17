import assert from "node:assert/strict";
import { test } from "node:test";
import type { CachedLink } from "../src/bindings.ts";
import { parseUserAgent as parseUserAgentEnhanced } from "../src/lib/analytics-enhanced.ts";
import { parseUserAgent, resolveDestination } from "../src/lib/analytics.ts";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";

const cases = [
  { ua: IPHONE, os: "iOS", osVersion: "17.6", device: "mobile" },
  { ua: IPAD, os: "iOS", osVersion: "17.6", device: "tablet" },
  { ua: ANDROID, os: "Android", osVersion: "14", device: "mobile" },
  { ua: MAC_SAFARI, os: "macOS", osVersion: "10.15.7", device: "desktop" },
];

for (const { ua, os, osVersion, device } of cases) {
  test(`parseUserAgent classifies ${os} ${device}`, () => {
    for (const parsed of [parseUserAgent(ua), parseUserAgentEnhanced(ua)]) {
      assert.equal(parsed.os, os);
      assert.equal(parsed.osVersion, osVersion);
      assert.equal(parsed.device, device);
    }
  });
}

test("iosUrl targeting fires for iPhone and iPad, not for macOS", () => {
  const link = {
    id: "l1",
    slug: "app",
    domain: "go2.gg",
    destinationUrl: "https://example.com",
    iosUrl: "https://apps.apple.com/app/id1",
    androidUrl: "https://play.google.com/store/apps/details?id=x",
  } as CachedLink;
  const at = (ua: string) =>
    resolveDestination(link, new Request("https://go2.gg/app", { headers: { "user-agent": ua } }));
  assert.equal(at(IPHONE), link.iosUrl);
  assert.equal(at(IPAD), link.iosUrl);
  assert.equal(at(ANDROID), link.androidUrl);
  assert.equal(at(MAC_SAFARI), link.destinationUrl);
});

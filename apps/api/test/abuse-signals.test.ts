import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ABUSE_THRESHOLDS,
  type LinkSample,
  clicksPerHour,
  destinationFingerprint,
  evaluateAccount,
  evaluateLink,
  findRingFingerprints,
  isImageDestination,
} from "../src/lib/abuse-signals.ts";

const link = (over: Partial<LinkSample> = {}): LinkSample => ({
  id: "l1",
  userId: "u1",
  destinationUrl: "https://example.com/page",
  clickCount: 0,
  clicksPerHour: null,
  ...over,
});

// --- the incident ----------------------------------------------------------

test("open-tracking pixel: image destination at volume is high tier", () => {
  const hits = evaluateLink(
    link({
      destinationUrl: "https://www.hostpic.org/images/2608111516150078.png",
      clickCount: 262_394,
      clicksPerHour: 900,
    })
  );
  assert.equal(hits[0].tier, "high");
  assert.equal(hits[0].signal, "open_pixel_burst");
});

test("a single link at ring velocity is high tier", () => {
  const hits = evaluateLink(link({ clickCount: 500_000, clicksPerHour: 2_000 }));
  assert.equal(hits[0].tier, "high");
  assert.equal(hits[0].signal, "link_click_burst");
});

test("lifetime seed rule fires when there is no baseline yet", () => {
  // A link's first scan has no previous snapshot to diff against, so velocity
  // is null. Without this rule the 2.9M-click link would go unnoticed until
  // the second pass.
  const hits = evaluateLink(link({ clickCount: 2_917_856, clicksPerHour: null }));
  assert.equal(hits[0].tier, "high");
  assert.equal(hits[0].signal, "link_click_lifetime");
});

test("load-spreading across many links is caught at the account level", () => {
  // Each link stays under the per-link bar; the account total does not.
  const links = Array.from({ length: 10 }, (_, i) =>
    link({ id: `l${i}`, clickCount: 5_000, clicksPerHour: 400 })
  );
  const hits = evaluateAccount("u1", links);
  assert.equal(hits[0].tier, "high");
  assert.equal(hits[0].signal, "account_click_burst");
});

test("ring fingerprint groups the shared affiliate sub-id across accounts", () => {
  const hits = findRingFingerprints([
    { id: "a", userId: "u1", destinationUrl: "https://steptrea.com/26W1Z61T/7MHZBPX7/?c=1" },
    { id: "b", userId: "u2", destinationUrl: "https://steptrea.com/26W1Z61T/7M5L444B/?c=2" },
    { id: "c", userId: "u3", destinationUrl: "https://steptrea.com/26W1Z61T/7MKXW3CH/?c=3" },
  ]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].measured, 3);
  // Never high: a marketing agency across three seats is a real collision.
  assert.equal(hits[0].tier, "medium");
});

test("the same fingerprint under one account is not a ring", () => {
  const hits = findRingFingerprints([
    { id: "a", userId: "u1", destinationUrl: "https://steptrea.com/26W1Z61T/x" },
    { id: "b", userId: "u1", destinationUrl: "https://steptrea.com/26W1Z61T/y" },
    { id: "c", userId: "u1", destinationUrl: "https://steptrea.com/26W1Z61T/z" },
  ]);
  assert.equal(hits.length, 0);
});

// --- false positives are the expensive failure -----------------------------

test("the one live legitimate image link stays medium, never high", () => {
  // Measured: exactly one live link platform-wide points at an image file,
  // with 5 lifetime clicks. It must never be auto-enforced.
  const hits = evaluateLink(
    link({ destinationUrl: "https://example.com/logo.png", clickCount: 5, clicksPerHour: 0 })
  );
  assert.ok(hits.every((h) => h.tier === "medium"));
});

test("ordinary traffic produces no hits at all", () => {
  assert.equal(evaluateLink(link({ clickCount: 900, clicksPerHour: 3 })).length, 0);
  assert.equal(evaluateAccount("u1", [link({ clickCount: 900, clicksPerHour: 3 })]).length, 0);
});

test("destinationFingerprint ignores ordinary routing paths", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://docs.google.com/document/d/1a2b3c/edit",
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://github.com/vercel",
    "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    "https://example.com/blog/my-post",
    "https://example.com/",
  ]) {
    assert.equal(destinationFingerprint(url), null, `must not fingerprint ${url}`);
  }
});

test("destinationFingerprint does catch opaque campaign ids", () => {
  assert.equal(
    destinationFingerprint("https://www.steptrea.com/26W1Z61T/7MHZBPX7/?creative_id=1"),
    "steptrea.com/26w1z61t"
  );
  assert.equal(
    destinationFingerprint("https://www.exploredomainpole.com/3NKHWHB/2B9D4727/"),
    "exploredomainpole.com/3nkhwhb"
  );
});

test("isImageDestination ignores query strings and non-images", () => {
  assert.ok(isImageDestination("https://h.org/images/x.png?v=2"));
  assert.ok(!isImageDestination("https://example.com/pngfoo"));
  assert.ok(!isImageDestination("https://example.com/article-about-png"));
  assert.ok(!isImageDestination("not a url"));
});

// --- velocity maths --------------------------------------------------------

test("clicksPerHour returns null without a usable baseline", () => {
  const now = Date.parse("2026-08-23T12:00:00Z");
  assert.equal(clicksPerHour(100, null, null, now), null);
  assert.equal(clicksPerHour(100, 0, "not-a-date", now), null);
  // Sub-minute elapsed time makes the rate explosive and meaningless.
  assert.equal(clicksPerHour(100, 0, "2026-08-23T11:59:59Z", now), null);
});

test("clicksPerHour normalises the delta to an hourly rate", () => {
  const now = Date.parse("2026-08-23T12:00:00Z");
  assert.equal(clicksPerHour(1_000, 0, "2026-08-23T11:00:00Z", now), 1_000);
  assert.equal(clicksPerHour(1_000, 0, "2026-08-23T10:00:00Z", now), 500);
  // A counter that went backwards (link reset) must not read as negative.
  assert.equal(clicksPerHour(10, 500, "2026-08-23T11:00:00Z", now), 0);
});

test("thresholds keep a wide margin over observed legitimate traffic", () => {
  // No live link has ever exceeded 10k lifetime clicks; the per-hour bar sits
  // well above anything a real user has produced.
  assert.ok(ABUSE_THRESHOLDS.LINK_LIFETIME_HARD > 10_000);
  assert.ok(ABUSE_THRESHOLDS.STRIKE_COOLDOWN_HOURS >= 24);
  assert.equal(ABUSE_THRESHOLDS.STRIKES_BEFORE_SUSPENSION, 3);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { detectBrandImpersonation } from "../src/lib/brand-impersonation.ts";

// The two live phishing campaigns this detector exists to catch. Both ran for
// days-to-months with Safe Browsing returning a positive "clean" the whole time.

test("roblox.com.bz — brand domain embedded, real TLD demoted to a label", () => {
  const hit = detectBrandImpersonation(
    "https://roblox.com.bz/games/108895582929142/Untitled-Experience?privateServerLinkCode=1026"
  );
  assert.ok(hit, "must flag the Netcraft-reported destination");
  assert.match(hit.reason, /roblox/);
});

test("roblox.com.ge — same campaign, second TLD", () => {
  assert.ok(detectBrandImpersonation("https://roblox.com.ge/games/81494014039346/x"));
});

test("xfinitimblay.jumpingcrab.com — brand token on a dynamic-DNS host", () => {
  const hit = detectBrandImpersonation("https://xfinitimblay.jumpingcrab.com/?verify");
  assert.ok(hit, "must flag the Xfinity credential-harvest host");
  assert.match(hit.reason, /xfinity|dynamic_dns/);
});

test("paypal.com.secure-login.io — classic domain-in-domain", () => {
  assert.ok(detectBrandImpersonation("https://paypal.com.secure-login.io/account"));
});

// Legitimate destinations must survive. A false positive here disables a
// paying customer's link, so these are the load-bearing tests.

test("the real brand domains are never flagged", () => {
  for (const url of [
    "https://roblox.com/games/123",
    "https://www.roblox.com/games/123",
    "https://web.roblox.com/home",
    "https://paypal.com/signin",
    "https://www.paypal.com/us/home",
    "https://xfinity.com/login",
    "https://apple.com/icloud",
    "https://www.google.com/search?q=roblox",
    "https://youtube.com/watch?v=abc",
  ]) {
    assert.equal(detectBrandImpersonation(url), null, `${url} must not be flagged`);
  }
});

test("a brand name in the path or query is not impersonation", () => {
  assert.equal(detectBrandImpersonation("https://example.com/how-to-play-roblox"), null);
  assert.equal(detectBrandImpersonation("https://blog.example.com/?q=paypal+fees"), null);
});

test("an unrelated dynamic-DNS host with no brand token is left alone", () => {
  assert.equal(detectBrandImpersonation("https://myhomelab.jumpingcrab.com/"), null);
});

test("ordinary destinations are left alone", () => {
  for (const url of [
    "https://github.com/vercel/next.js",
    "https://developers.cloudflare.com/workers/",
    "https://news.ycombinator.com/item?id=1",
    "https://a-very-normal-startup.io/pricing",
  ]) {
    assert.equal(detectBrandImpersonation(url), null, `${url} must not be flagged`);
  }
});

test("malformed input never throws", () => {
  for (const url of ["", "not a url", "file:///etc/passwd", "javascript:alert(1)"]) {
    assert.doesNotThrow(() => detectBrandImpersonation(url));
  }
});

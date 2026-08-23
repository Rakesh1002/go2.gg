import assert from "node:assert/strict";
import { test } from "node:test";
import { detectDestinationHeuristics } from "../src/lib/destination-heuristics.ts";

// The observed 2026-08-23 ring payload: base64 that decodes to
// `app/redirection/wrap.php?track=A1XC-1XR2XM0XS5203X...`
const RING_B64 =
  "YXBwL3JlZGlyZWN0aW9uL3dyYXAucGhwP3RyYWNrPUExWEMtMVhSMlhNMFhTNTIwM1hWMFhONVhPMzA3WFcwWFAwWEwwWFUwWFQxWA==";

test("the exact ring URL blocks — base64 redirector on a free host", () => {
  const hit = detectDestinationHeuristics(`https://ofppt.eu.cc/app/wrap/${RING_B64}`);
  assert.ok(hit, "must flag the ring destination");
  assert.equal(hit.severity, "block");
  assert.match(hit.reason, /redirector_on_free_host/);
});

test("a base64 redirector on a normal host is suspect, not blocked", () => {
  // Same payload, ordinary hostname. One signal alone must never block.
  const hit = detectDestinationHeuristics(`https://example.com/app/wrap/${RING_B64}`);
  assert.equal(hit?.severity, "suspect");
  assert.equal(hit?.reason, "local:base64_redirector");
});

test("a free host without a redirector is only suspect", () => {
  const hit = detectDestinationHeuristics("https://someone.eu.cc/about");
  assert.equal(hit?.severity, "suspect");
  assert.match(hit.reason, /free_hosting/);
});

test("affiliate network shape is labelled but NEVER blocked", () => {
  // Affiliate marketing is a legitimate, paying use case for a shortener.
  // Blocking this shape would break the customers most likely to pay.
  for (const url of [
    "https://www.steptrea.com/26W1Z61T/7MHZBPX7/?creative_id=14581",
    "https://www.exploredomainpole.com/3NKHWHB/2B9D4727/?creative_id=61620",
  ]) {
    const hit = detectDestinationHeuristics(url);
    assert.equal(hit?.severity, "suspect", `${url} must be suspect, never block`);
  }
});

// --- false positives are the expensive failure ----------------------------

test("legitimate destinations produce no hit at all", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://github.com/vercel/next.js",
    "https://docs.google.com/document/d/1a2b3c/edit",
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    "https://www.cloudflare.com/developer-platform/products/workers/",
    "https://example.com/blog/a-post-about-tracking-pixels",
    "https://maps.app.goo.gl/dJwnmi5g9WERmUd26",
  ]) {
    assert.equal(detectDestinationHeuristics(url), null, `must not flag ${url}`);
  }
});

test("this product's own users' deploy targets are never flagged", () => {
  // pages.dev / workers.dev / vercel.app are abused too, but they are the
  // default deploy targets of exactly the developer audience go2.gg sells to.
  for (const url of [
    "https://my-app.pages.dev/",
    "https://api.my-worker.workers.dev/",
    "https://my-site.vercel.app/",
    "https://my-site.netlify.app/",
    "https://my-thing.repl.co/",
  ]) {
    assert.equal(detectDestinationHeuristics(url), null, `must not flag ${url}`);
  }
});

test("base64-looking segments that are not redirectors do not fire", () => {
  // Image proxies and SPA routers use base64 path segments too; they decode to
  // image URLs and JSON, not to a redirect script with query machinery.
  const imageProxy = btoa("https://cdn.example.com/photos/cat.jpg");
  assert.equal(detectDestinationHeuristics(`https://imgproxy.example.com/${imageProxy}`), null);
  const jsonish = btoa('{"page":"home","locale":"en-GB"}');
  assert.equal(detectDestinationHeuristics(`https://app.example.com/state/${jsonish}`), null);
});

test("a redirect word alone, without redirect machinery, does not fire", () => {
  const plain = btoa("this is a track from the album and nothing more");
  assert.equal(detectDestinationHeuristics(`https://example.com/${plain}`), null);
});

test("malformed and non-http input never throws", () => {
  for (const url of ["", "not a url", "javascript:alert(1)", "ftp://x/y", "data:text/html,x"]) {
    assert.equal(detectDestinationHeuristics(url), null);
  }
});

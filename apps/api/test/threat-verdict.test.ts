import assert from "node:assert/strict";
import { test } from "node:test";
import { composeThreatVerdict } from "../src/lib/threat-verdict.ts";

test("Safe Browsing clean is enough on its own — URL Scanner unavailable must not pin a link as unknown", () => {
  // Production reality: Cloudflare URL Scanner returns null (http_error / never
  // scanned) for ~every destination, so requiring both scanners left ~92% of
  // links stuck "unknown" → permanent safety interstitial → no OG previews.
  const verdict = composeThreatVerdict({ flagged: false, threats: [] }, null);
  assert.equal(verdict.status, "clean");
  assert.deepEqual(verdict.scanners, ["safe_browsing"]);
});

test("URL Scanner clean alone is also enough", () => {
  const verdict = composeThreatVerdict(null, { flagged: false, reasons: [] });
  assert.equal(verdict.status, "clean");
  assert.deepEqual(verdict.scanners, ["url_scanner"]);
});

test("both scanners clean → clean", () => {
  const verdict = composeThreatVerdict({ flagged: false, threats: [] }, { flagged: false, reasons: [] });
  assert.equal(verdict.status, "clean");
  assert.deepEqual(verdict.scanners, ["safe_browsing", "url_scanner"]);
});

test("no scanner could answer → unknown (keep the interstitial engaged)", () => {
  const verdict = composeThreatVerdict(null, null);
  assert.equal(verdict.status, "unknown");
  assert.deepEqual(verdict.scanners, []);
});

test("Safe Browsing flag wins → flagged with source-prefixed verdict", () => {
  const verdict = composeThreatVerdict({ flagged: true, threats: ["SOCIAL_ENGINEERING"] }, null);
  assert.equal(verdict.status, "flagged");
  assert.equal(verdict.verdict, "safe_browsing:SOCIAL_ENGINEERING");
});

test("URL Scanner flag wins even when Safe Browsing is clean", () => {
  const verdict = composeThreatVerdict({ flagged: false, threats: [] }, { flagged: true, reasons: ["phishing"] });
  assert.equal(verdict.status, "flagged");
  assert.equal(verdict.verdict, "url_scanner:phishing");
});

test("brand heuristic overrides a Safe Browsing 'clean' — the roblox.com.bz hole", () => {
  // Safe Browsing returned exactly this (not-flagged, i.e. clean) for the whole
  // 2 days the Netcraft-reported campaign was live. The local signal must win.
  const verdict = composeThreatVerdict({ flagged: false, threats: [] }, null, {
    reason: "brand_heuristic:roblox:embedded_domain",
  });
  assert.equal(verdict.status, "flagged");
  assert.equal(verdict.verdict, "brand_heuristic:roblox:embedded_domain");
  assert.ok(verdict.scanners.includes("brand_heuristic"));
});

test("brand heuristic alone is enough when no scanner answers", () => {
  const verdict = composeThreatVerdict(null, null, { reason: "brand_heuristic:xfinity:dynamic_dns" });
  assert.equal(verdict.status, "flagged");
});

test("omitting the brand argument preserves the existing two-scanner behaviour", () => {
  const verdict = composeThreatVerdict({ flagged: false, threats: [] }, null);
  assert.equal(verdict.status, "clean");
  assert.deepEqual(verdict.scanners, ["safe_browsing"]);
});

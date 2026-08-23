import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type BlocklistEntry,
  compileBlocklist,
  decodeBase64Segment,
  matchBlocklist,
  normalizeBlocklistValue,
  proposeBlocklistEntries,
} from "../src/lib/destination-blocklist.ts";

// The 2026-08-23 spam ring: 12 accounts, 274 links, 4.6M clicks. Google Safe
// Browsing returned "clean" on every destination, correctly — this is spam,
// not malware. The blocklist is the only layer that covers this class.
const RING: BlocklistEntry[] = [
  { kind: "host", value: "hostpic.org", action: "block", reason: "pixel host" },
  { kind: "host", value: "ofppt.eu.cc", action: "block", reason: "redirector" },
  { kind: "path_segment", value: "26w1z61t", action: "block", reason: "affiliate sub-id" },
  { kind: "path_segment", value: "3nkhwhb", action: "block", reason: "affiliate sub-id" },
];
const list = compileBlocklist(RING);

test("blocks the open-tracking pixel host", () => {
  const hit = matchBlocklist("https://www.hostpic.org/images/2608111516150078.png", list);
  assert.ok(hit, "must match the pixel host");
  assert.equal(hit.kind, "host");
});

test("path_segment survives the operator changing hosts", () => {
  // The whole point: block the affiliate sub-id once and every future host
  // carrying it is dead on arrival.
  assert.ok(matchBlocklist("https://www.steptrea.com/26W1Z61T/7MHZBPX7/?creative_id=14581", list));
  assert.ok(matchBlocklist("https://some-brand-new-domain.example/26W1Z61T/x", list));
  assert.ok(matchBlocklist("https://www.exploredomainpole.com/3NKHWHB/2B9D4727/", list));
});

test("base64-wrapped redirector payloads are unwrapped before matching", () => {
  // The ring already base64-wrapped its target. Without decoding, one btoa()
  // call defeats the whole list.
  const inner = btoa("app/redirection/wrap.php?track=26W1Z61T");
  assert.ok(matchBlocklist(`https://unknown-host.example/app/wrap/${inner}`, list));
});

test("decodeBase64Segment rejects binary and short blobs", () => {
  assert.equal(decodeBase64Segment("short"), null);
  assert.equal(decodeBase64Segment("not-base64-at-all!!"), null);
  assert.ok(decodeBase64Segment(btoa("app/redirection/wrap.php?track=A1XC")));
});

test("host match is case- and www-insensitive", () => {
  assert.ok(matchBlocklist("https://WWW.HostPic.ORG/images/x.png", list));
});

test("host_suffix matches subdomains but an unrelated host does not", () => {
  const suffixList = compileBlocklist([
    { kind: "host_suffix", value: "eu.cc", action: "block", reason: "free subdomain" },
  ]);
  assert.ok(matchBlocklist("https://ofppt.eu.cc/app/wrap/x", suffixList));
  assert.ok(matchBlocklist("https://eu.cc/x", suffixList));
  assert.equal(matchBlocklist("https://noteu.cc/x", suffixList), null);
});

// Legitimate destinations must survive. A false positive here disables a real
// customer's links, which is the expensive failure at this platform's size.
test("legitimate destinations are not matched", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://github.com/vercel/next.js",
    "https://docs.google.com/document/d/1a2b3c/edit",
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    "https://hostpicture.org/images/x.png",
    "https://example.com/26w1z61",
  ]) {
    assert.equal(matchBlocklist(url, list), null, `must not match ${url}`);
  }
});

test("malformed and non-http input never throws", () => {
  for (const url of ["", "not a url", "javascript:alert(1)", "ftp://x/26w1z61t"]) {
    assert.equal(matchBlocklist(url, list), null);
  }
});

test("suspect entries are returned with their action intact", () => {
  const soft = compileBlocklist([
    { kind: "host", value: "affiliate.example", action: "suspect", reason: "cpa network" },
  ]);
  const hit = matchBlocklist("https://affiliate.example/offer/1", soft);
  assert.equal(hit?.action, "suspect");
});

test("normalizeBlocklistValue produces keys the matcher derives", () => {
  assert.equal(normalizeBlocklistValue("host", "https://www.HostPic.org/"), "hostpic.org");
  assert.equal(normalizeBlocklistValue("path_segment", "/26W1Z61T"), "26w1z61t");
  assert.equal(
    normalizeBlocklistValue("path_prefix", "https://www.Steptrea.com/26W1Z61T"),
    "steptrea.com/26w1z61t"
  );
});

test("proposeBlocklistEntries derives the ring fingerprints from one link", () => {
  const proposals = proposeBlocklistEntries(
    "https://www.steptrea.com/26W1Z61T/7MHZBPX7/?creative_id=14581"
  );
  assert.ok(proposals.some((p) => p.kind === "host" && p.value === "steptrea.com"));
  assert.ok(proposals.some((p) => p.kind === "path_segment" && p.value === "26w1z61t"));
});

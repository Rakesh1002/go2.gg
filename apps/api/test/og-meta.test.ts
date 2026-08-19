import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOgMeta, parseYouTubeId } from "../src/lib/og-meta.ts";

test("extracts the YouTube video id from every common URL shape", () => {
  assert.equal(parseYouTubeId("https://youtu.be/Z3Iktf1CLRg?si=e5cjKUJ47M4PV0Pn"), "Z3Iktf1CLRg");
  assert.equal(parseYouTubeId("https://www.youtube.com/watch?v=Z3Iktf1CLRg&t=10s"), "Z3Iktf1CLRg");
  assert.equal(parseYouTubeId("https://youtube.com/shorts/Z3Iktf1CLRg"), "Z3Iktf1CLRg");
  assert.equal(parseYouTubeId("https://m.youtube.com/watch?v=Z3Iktf1CLRg"), "Z3Iktf1CLRg");
});

test("returns null for non-YouTube or malformed URLs", () => {
  assert.equal(parseYouTubeId("https://example.com/watch?v=abc"), null);
  assert.equal(parseYouTubeId("https://vimeo.com/12345"), null);
  assert.equal(parseYouTubeId("not a url"), null);
});

test("extracts standard Open Graph tags regardless of attribute order", () => {
  const html = `<html><head>
    <meta property="og:title" content="My Video">
    <meta content="A great clip" property="og:description">
    <meta property="og:image" content="https://i.ytimg.com/vi/abc/hq.jpg">
  </head></html>`;
  const og = parseOgMeta(html);
  assert.equal(og.title, "My Video");
  assert.equal(og.description, "A great clip");
  assert.equal(og.image, "https://i.ytimg.com/vi/abc/hq.jpg");
});

test("falls back to twitter:* then <title>/meta description", () => {
  const html = `<head>
    <title>Page Title</title>
    <meta name="twitter:image" content="https://x/y.png">
    <meta name="description" content="Plain description">
  </head>`;
  const og = parseOgMeta(html);
  assert.equal(og.title, "Page Title");
  assert.equal(og.description, "Plain description");
  assert.equal(og.image, "https://x/y.png");
});

test("decodes HTML entities in extracted values", () => {
  const html = `<meta property="og:title" content="Tom &amp; Jerry &#39;96">`;
  assert.equal(parseOgMeta(html).title, "Tom & Jerry '96");
});

test("returns undefined fields when no metadata present", () => {
  const og = parseOgMeta("<html><body>nothing here</body></html>");
  assert.equal(og.title, undefined);
  assert.equal(og.description, undefined);
  assert.equal(og.image, undefined);
});

test("handles single-quoted attributes", () => {
  const og = parseOgMeta(`<meta property='og:title' content='Single quoted'>`);
  assert.equal(og.title, "Single quoted");
});

test("finds OG tags that sit deep in a large <head> (e.g. YouTube ~630KB in)", () => {
  // YouTube front-loads ~630KB of inline script before its og:* tags; the
  // parser must scan the whole head, not just the first chunk.
  const filler = `<script>${"x".repeat(400_000)}</script>`;
  const html = `<html><head>${filler}<meta property="og:title" content="Deep Title"><meta property="og:image" content="https://i/y.jpg"></head><body></body></html>`;
  const og = parseOgMeta(html);
  assert.equal(og.title, "Deep Title");
  assert.equal(og.image, "https://i/y.jpg");
});

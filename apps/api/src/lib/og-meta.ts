/**
 * Read the destination page's Open Graph metadata so a short link can expose
 * it at its own URL.
 *
 * Link-preview crawlers and OG validators do not all follow 30x redirects
 * (e.g. OrcaScan, many server-side unfurlers), so relying on a redirect to
 * carry them to the destination's own tags leaves them with nothing. Instead
 * we fetch the destination once, mirror its tags onto the short URL, and cache
 * the result. Real browser navigations never hit this path — they get the
 * instant 302.
 */
import type { Env } from "../bindings.js";

export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  if (!m) return undefined;
  return m[2] ?? m[3];
}

/**
 * Extract OG metadata from an HTML string. Pure — no network. Reads og:* with
 * twitter:* and <title>/meta-description fallbacks; first occurrence wins.
 */
export function parseOgMeta(html: string): OgMeta {
  // OG tags live in <head>, but sites like YouTube front-load hundreds of KB
  // of inline script before them — scan the whole head (up to a CPU-safety
  // ceiling), not just the first chunk.
  const headEnd = html.search(/<\/head\s*>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html.slice(0, 2_000_000);
  const tags: Record<string, string> = {};
  const metaTags = head.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const key = (attr(tag, "property") ?? attr(tag, "name"))?.toLowerCase();
    if (!key) continue;
    const content = attr(tag, "content");
    if (content == null) continue;
    if (!(key in tags)) tags[key] = content;
  }

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  const pick = (...vals: Array<string | undefined>): string | undefined => {
    const v = vals.find((x) => x != null && x.trim() !== "");
    return v ? decodeEntities(v.trim()) : undefined;
  };

  return {
    title: pick(tags["og:title"], tags["twitter:title"], titleTag),
    description: pick(tags["og:description"], tags["twitter:description"], tags.description),
    image: pick(tags["og:image"], tags["og:image:url"], tags["og:image:secure_url"], tags["twitter:image"]),
  };
}

/**
 * Extract a YouTube video id from any common URL shape, or null. YouTube
 * redirects datacenter fetches to a Google consent page that rate-limits
 * (429) Cloudflare egress, so we can't scrape its OG tags — we use oEmbed +
 * the public thumbnail CDN instead (see fetchYouTubeOg).
 */
export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const valid = (id: string | undefined): string | null =>
    id && /^[\w-]{11}$/.test(id) ? id : null;
  if (host === "youtu.be") return valid(u.pathname.slice(1).split("/")[0]);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") return valid(u.searchParams.get("v") ?? undefined);
    const m = u.pathname.match(/^\/(shorts|embed|v)\/([\w-]{11})/);
    if (m) return valid(m[2]);
  }
  return null;
}

async function fetchYouTubeOg(url: string, id: string): Promise<OgMeta | null> {
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { headers: { "user-agent": OG_FETCH_UA }, signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS) }
    );
    if (res.ok) {
      const j = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      return {
        title: j.title,
        description: j.author_name ? `YouTube · ${j.author_name}` : "YouTube",
        image: j.thumbnail_url || thumb,
      };
    }
  } catch {
    // oEmbed unreachable — fall through to the thumbnail-only card below.
  }
  // oEmbed unavailable — the thumbnail CDN is always reachable, so at least
  // serve a card with the video still.
  return { title: "YouTube", description: "YouTube", image: thumb };
}

const OG_FETCH_UA =
  "Mozilla/5.0 (compatible; go2.gg link preview; +https://go2.gg) facebookexternalhit/1.1";
const OG_FETCH_TIMEOUT_MS = 3500;
const OG_MAX_BYTES = 2 * 1024 * 1024;
const OG_CACHE_TTL_OK = 86_400;
const OG_CACHE_TTL_MISS = 3_600;

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Read just enough of the response to cover <head>: stream chunks until we see
 * </head> (where all OG tags live) or hit the byte ceiling. Avoids buffering
 * megabytes for the common small page while still reaching YouTube-sized heads.
 */
async function readHeadHtml(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let html = "";
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      html += decoder.decode(value, { stream: true });
      const headEnd = html.search(/<\/head\s*>/i);
      if (headEnd >= 0) return html.slice(0, headEnd);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return html;
}

/**
 * Fetch + cache the destination's OG metadata. Returns null when the URL is
 * not fetchable HTML or carries no usable tags — callers fall back to a 302.
 */
export async function fetchDestinationOg(env: Env, url: string): Promise<OgMeta | null> {
  if (!/^https?:\/\//i.test(url)) return null;

  const cacheKey = `ogcache:${await sha256Hex(url)}`;
  const cached = await env.LINKS_KV.get<{ v: OgMeta | null }>(cacheKey, "json").catch(() => null);
  if (cached) return cached.v;

  let og: OgMeta | null = null;

  // YouTube/Google block server-side OG scraping (consent redirect + 429 on
  // datacenter IPs). Use oEmbed + the thumbnail CDN instead.
  const ytId = parseYouTubeId(url);
  if (ytId) {
    og = await fetchYouTubeOg(url, ytId);
    await env.LINKS_KV.put(cacheKey, JSON.stringify({ v: og }), {
      expirationTtl: og ? OG_CACHE_TTL_OK : OG_CACHE_TTL_MISS,
    }).catch(() => undefined);
    return og;
  }

  try {
    const res = await fetch(url, {
      headers: { "user-agent": OG_FETCH_UA, accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes("text/html")) {
      const parsed = parseOgMeta(await readHeadHtml(res, OG_MAX_BYTES));
      if (parsed.title || parsed.description || parsed.image) og = parsed;
    }
  } catch {
    // Network/timeout — leave og null, cache the miss briefly, fall back to 302.
  }

  await env.LINKS_KV.put(cacheKey, JSON.stringify({ v: og }), {
    expirationTtl: og ? OG_CACHE_TTL_OK : OG_CACHE_TTL_MISS,
  }).catch(() => undefined);

  return og;
}

/**
 * OG (Open Graph) unfurler — fetches a remote URL and extracts the bits we
 * care about for rendering as a preview card on the bio page.
 *
 * Runs on Cloudflare Workers, so we use HTMLRewriter (built in) rather than
 * pulling in `cheerio` / `linkedom`. Times out at 5s — we never want a slow
 * upstream to block link creation.
 */

export interface OgMeta {
  /** From <meta property="og:title"> or <title>. */
  title: string | null;
  /** From <meta property="og:description"> or <meta name="description">. */
  description: string | null;
  /** From <meta property="og:image">, resolved to absolute. */
  imageUrl: string | null;
}

const FETCH_TIMEOUT_MS = 5000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; Go2BioBot/1.0; +https://go2.gg) — link-preview unfurler";

export async function unfurl(url: string): Promise<OgMeta> {
  const empty: OgMeta = { title: null, description: null, imageUrl: null };

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return empty;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") return empty;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(target.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ac.signal,
      redirect: "follow",
      cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit & { cf?: Record<string, unknown> });
  } catch {
    clearTimeout(timer);
    return empty;
  }
  clearTimeout(timer);

  const ct = response.headers.get("content-type") ?? "";
  if (!response.ok || !ct.includes("text/html")) return empty;

  const meta: OgMeta = { title: null, description: null, imageUrl: null };
  let titleFallback = "";

  const rewriter = new HTMLRewriter()
    .on("meta", {
      element(el) {
        const property = el.getAttribute("property") ?? el.getAttribute("name");
        const content = el.getAttribute("content");
        if (!property || !content) return;
        const k = property.toLowerCase();
        if (k === "og:title" && !meta.title) meta.title = content;
        else if (k === "og:description" && !meta.description) meta.description = content;
        else if (k === "description" && !meta.description) meta.description = content;
        else if (k === "og:image" && !meta.imageUrl) meta.imageUrl = content;
        else if (k === "twitter:image" && !meta.imageUrl) meta.imageUrl = content;
      },
    })
    .on("title", {
      text(t) {
        titleFallback += t.text;
      },
    });

  // Reading the body fully, capped at 256 KB — OG meta is always in <head>,
  // anything past that is wasted bandwidth.
  const body = response.body;
  if (!body) return empty;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const cap = 256 * 1024;
  try {
    while (total < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }

  await rewriter.transform(new Response(merged)).arrayBuffer();

  if (!meta.title && titleFallback) meta.title = titleFallback.trim().slice(0, 200);
  if (meta.description) meta.description = meta.description.slice(0, 300);

  // Resolve relative og:image URLs against the page's URL.
  if (meta.imageUrl) {
    try {
      meta.imageUrl = new URL(meta.imageUrl, target).toString();
    } catch {
      meta.imageUrl = null;
    }
  }

  return meta;
}

/**
 * Human-confirmed abusive destination matching.
 *
 * The layer that turns one finished investigation into permanent coverage.
 * Google Safe Browsing returned "clean" on all 274 links of the 2026-08-23
 * spam ring — correctly, because bulk-email spam is not malware. No upstream
 * feed covers this class, so the only durable signal is the one an operator
 * records after investigating.
 *
 * Matched from checkDestinationThreat, which every create path AND the 4h
 * rescan cron already share. That means adding an entry both blocks new links
 * and retroactively disables existing matches on the next rescan pass.
 *
 * Pure and network-free like brand-impersonation.ts: never throws, returns
 * null on unparseable input. The D1 table is the source of truth; the read
 * path uses a compiled snapshot in KV (see loadBlocklist).
 */
import type { Env } from "../bindings.js";

export type BlocklistKind = "host" | "host_suffix" | "path_prefix" | "path_segment";
export type BlocklistAction = "block" | "suspect";

export interface BlocklistEntry {
  kind: BlocklistKind;
  value: string;
  action: BlocklistAction;
  reason: string;
}

/**
 * Pre-bucketed for O(1) host/segment lookups on the hot path. Rebuilt on every
 * admin write, never assembled per request.
 */
export interface CompiledBlocklist {
  hosts: Record<string, BlocklistEntry>;
  pathSegments: Record<string, BlocklistEntry>;
  hostSuffixes: BlocklistEntry[];
  pathPrefixes: BlocklistEntry[];
}

export const EMPTY_BLOCKLIST: CompiledBlocklist = {
  hosts: {},
  pathSegments: {},
  hostSuffixes: [],
  pathPrefixes: [],
};

export const BLOCKLIST_KV_KEY = "blocklist:v1";

/** Normalize a hostname: lowercase, strip trailing dot and a leading "www.". */
export function normalizeHost(host: string): string {
  let h = host.trim().toLowerCase().replace(/\.$/, "");
  if (h.startsWith("www.")) h = h.slice(4);
  return h;
}

/**
 * Decode a base64/base64url path segment, or null when it isn't one.
 *
 * The ring wrapped its redirector target in base64 (`/app/wrap/<b64>`), so a
 * blocklist that only reads literal path text is defeated by one btoa() call.
 * Depth is capped at one level by the caller.
 */
export function decodeBase64Segment(segment: string): string | null {
  if (segment.length < 16 || !/^[A-Za-z0-9+/=_-]+$/.test(segment)) return null;
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    const decoded = atob(padded);
    // Reject binary/random blobs — only printable ASCII is a real payload.
    for (let i = 0; i < decoded.length; i++) {
      const code = decoded.charCodeAt(i);
      if (code > 0x7e) return null;
      if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) return null;
    }
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

interface ParsedDestination {
  host: string;
  /** Lowercased, percent-decoded, empties dropped. */
  segments: string[];
}

function parseDestination(rawUrl: string): ParsedDestination | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const segments: string[] = [];
  for (const raw of url.pathname.split("/")) {
    if (!raw) continue;
    let seg = raw;
    try {
      seg = decodeURIComponent(raw);
    } catch {
      // Malformed escape — keep the raw form rather than dropping the segment.
    }
    segments.push(seg.toLowerCase());

    // One level of base64 unwrapping. The decoded payload is itself a
    // path+query, so split it the same way and add its segments.
    const decoded = decodeBase64Segment(raw);
    if (decoded) {
      for (const inner of decoded.split(/[/?&=]/)) {
        if (inner) segments.push(inner.toLowerCase());
      }
    }
  }

  return { host: normalizeHost(url.hostname), segments };
}

/**
 * Returns the matching entry, or null. Order is cheapest-and-most-specific
 * first so an exact host match never pays for the suffix scan.
 */
export function matchBlocklist(rawUrl: string, list: CompiledBlocklist): BlocklistEntry | null {
  const parsed = parseDestination(rawUrl);
  if (!parsed) return null;
  const { host, segments } = parsed;

  const exact = list.hosts[host];
  if (exact) return exact;

  if (segments.length > 0) {
    const firstTwo = `${host}/${segments[0]}`;
    for (const entry of list.pathPrefixes) {
      if (firstTwo === entry.value || firstTwo.startsWith(`${entry.value}/`)) return entry;
    }
    for (const segment of segments) {
      const hit = list.pathSegments[segment];
      if (hit) return hit;
    }
  }

  for (const entry of list.hostSuffixes) {
    if (host === entry.value || host.endsWith(`.${entry.value}`)) return entry;
  }

  return null;
}

/** Bucket raw rows into the compiled shape. Inactive rows are dropped. */
export function compileBlocklist(entries: BlocklistEntry[]): CompiledBlocklist {
  const compiled: CompiledBlocklist = {
    hosts: {},
    pathSegments: {},
    hostSuffixes: [],
    pathPrefixes: [],
  };
  for (const entry of entries) {
    switch (entry.kind) {
      case "host":
        compiled.hosts[entry.value] = entry;
        break;
      case "path_segment":
        compiled.pathSegments[entry.value] = entry;
        break;
      case "host_suffix":
        compiled.hostSuffixes.push(entry);
        break;
      case "path_prefix":
        compiled.pathPrefixes.push(entry);
        break;
    }
  }
  return compiled;
}

/**
 * Normalize a value for storage so lookups are exact-match. Mirrors the
 * parsing above — an admin pasting "https://www.HostPic.org/" must produce
 * the same key the matcher derives from a destination URL.
 */
export function normalizeBlocklistValue(kind: BlocklistKind, raw: string): string {
  const trimmed = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  if (kind === "host" || kind === "host_suffix") {
    return normalizeHost(trimmed.split("/")[0]);
  }
  if (kind === "path_prefix") {
    const [hostPart, ...rest] = trimmed.split("/");
    return [normalizeHost(hostPart), ...rest].join("/");
  }
  return trimmed.replace(/^\/+/, "");
}

// In-isolate memo. ~1 KV read per isolate per minute; the compiled blob is a
// few KB at any realistic list size.
const CACHE_TTL_MS = 60_000;
let cache: { at: number; list: CompiledBlocklist } | null = null;

/** Test seam — reset the memo between cases. */
export function resetBlocklistCache(): void {
  cache = null;
}

/**
 * Read the compiled snapshot from KV. Fails OPEN on any error, matching the
 * create path's standing rule that an infrastructure hiccup must never turn
 * into "your link could not be created". Anything that slips through is
 * caught by the rescan cron within one pass, since it calls the same matcher
 * against the authoritative list.
 */
export async function loadBlocklist(env: Env): Promise<CompiledBlocklist> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.list;
  try {
    const raw = await env.KV_CONFIG.get<CompiledBlocklist>(BLOCKLIST_KV_KEY, "json");
    cache = { at: now, list: raw ?? EMPTY_BLOCKLIST };
  } catch {
    cache = { at: now, list: EMPTY_BLOCKLIST };
  }
  return cache.list;
}

/**
 * Recompile the active D1 rows into the KV snapshot the read path uses.
 * Call after every admin write — D1 is the source of truth, KV is the cache.
 */
export async function republishBlocklist(
  env: Env,
  rows: Array<{
    kind: string;
    value: string;
    action: string;
    reason: string;
    isActive: boolean | null;
  }>
): Promise<number> {
  const entries: BlocklistEntry[] = rows
    .filter((r) => r.isActive !== false)
    .map((r) => ({
      kind: r.kind as BlocklistKind,
      value: r.value,
      action: (r.action === "suspect" ? "suspect" : "block") as BlocklistAction,
      reason: r.reason,
    }));
  await env.KV_CONFIG.put(BLOCKLIST_KV_KEY, JSON.stringify(compileBlocklist(entries)));
  resetBlocklistCache();
  return entries.length;
}

/**
 * Propose blocklist entries from an abusive destination, so one investigation
 * becomes permanent coverage without hand-deriving the fingerprints.
 *
 * Returns candidates only — the caller decides which to commit, after seeing
 * how many existing links each would match.
 */
export function proposeBlocklistEntries(
  rawUrl: string
): Array<{ kind: BlocklistKind; value: string }> {
  const parsed = parseDestination(rawUrl);
  if (!parsed) return [];
  const out: Array<{ kind: BlocklistKind; value: string }> = [{ kind: "host", value: parsed.host }];
  if (parsed.segments.length > 0) {
    out.push({ kind: "path_prefix", value: `${parsed.host}/${parsed.segments[0]}` });
  }
  // Opaque uppercase-ish tokens are affiliate sub-ids — the fingerprint that
  // survives the operator changing hosts.
  for (const seg of parsed.segments) {
    if (seg.length >= 6 && seg.length <= 12 && /^[a-z0-9]+$/.test(seg) && /[0-9]/.test(seg)) {
      out.push({ kind: "path_segment", value: seg });
    }
  }
  return out;
}

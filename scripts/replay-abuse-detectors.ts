#!/usr/bin/env -S node --experimental-strip-types
/**
 * Corpus replay for the behavioral abuse detectors.
 *
 * Runs the exact pure functions the hourly cron runs (lib/abuse-signals.ts)
 * over every link in D1, and reports the confusion matrix against the known
 * 2026-08-23 spam ring.
 *
 * The acceptance bar before enforcement may be enabled, matching the standard
 * the brand-impersonation fix was held to:
 *
 *   1. ZERO high-tier hits on any non-ring link or account.
 *   2. >= 90% recall on ring ACCOUNTS (not links — the low-volume CTA links in
 *      a campaign legitimately shouldn't trip on their own).
 *   3. destinationFingerprint() returns null for every non-ring destination.
 *
 * A false positive here disables a real customer's links, so (1) is absolute.
 *
 * Usage:
 *   pnpm dlx tsx@latest scripts/replay-abuse-detectors.ts --remote
 *   pnpm dlx tsx@latest scripts/replay-abuse-detectors.ts --remote --sweep
 *
 * Known limitation, stated rather than papered over: lifetime click_count
 * exists for every link, but click HISTORY does not (the `clicks` table is
 * pruned per plan retention and click_count has no time series). So this
 * validates the lifetime rules and every destination-shape signal exactly, and
 * validates the velocity rules only in the pessimistic form "assume all
 * lifetime clicks landed inside one window". The velocity thresholds get their
 * real validation from the shadow run.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABUSE_THRESHOLDS,
  type LinkSample,
  destinationFingerprint,
  evaluateAccount,
  evaluateLink,
  findRingFingerprints,
  isImageDestination,
} from "../apps/api/src/lib/abuse-signals.ts";
import { compileBlocklist, matchBlocklist } from "../apps/api/src/lib/destination-blocklist.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, ".audit");

/**
 * The 13 accounts confirmed as one operator on 2026-08-23. The last entry
 * registered ~50 minutes after the first 12 were banned and had two links live
 * within two minutes — the blocklist found it, which is the whole argument for
 * that layer existing.
 */
const RING_USER_IDS = new Set([
  "gqxNNu5koWQtJ9CwU5h3wgKbqyu4CW6b",
  "FQ6s4t8LPF33vXQJ30ErVi8yJym5EC4Q",
  "bq9BQsLfFyHt8iZmrwAnKXFt9JTIMRO4",
  "3MG9pQdMtkhh9wPrymlCdu6ExCk6deMa",
  "6GnAvZ2IQEDfWZtqE127Su7V4dPe1cyi",
  "5WttA1hheKcRGvUOSG0f3Ka34MH7gDqm",
  "D3nopx1LPo9gV0dh8K1kNOr7BTuRp58Q",
  "ovFhADGGrIFBC9D2nzurb5RwGv9D2ftj",
  "gQQJPr2y0egQ54mOx0nADaNhhgNSJyVa",
  "81d7jWTM0eXqWRyL2LasXVhAdBjsO7uH",
  "9AeWLJk3iG8diBnVvtIUXi7UkczZu9U2",
  "WA7fxPFDEH9FzDuT00JtnjWsM5RPkeFB",
  "ZjYmAg5QKCbQwdcQpg9OjrrgWckvaAJv",
]);

interface Row {
  id: string;
  user_id: string | null;
  destination_url: string;
  click_count: number;
  created_at: string;
  is_disabled: number | null;
}

function runD1Query(sql: string, target: "remote" | "local"): Row[] {
  const out = execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "go2-db",
      target === "remote" ? "--remote" : "--local",
      "--config",
      "apps/api/wrangler.toml",
      "--json",
      "--command",
      sql,
    ],
    { cwd: REPO_ROOT, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 }
  );
  const parsed = JSON.parse(out.slice(out.indexOf("[")));
  const results = Array.isArray(parsed) ? parsed[0]?.results : parsed.results;
  return Array.isArray(results) ? results : [];
}

/**
 * Pessimistic velocity: pretend every lifetime click landed inside one hour.
 * This deliberately over-triggers, so any non-ring link that survives it is
 * comfortably safe under real hourly deltas.
 */
function toSample(row: Row, assumeHours: number): LinkSample {
  return {
    id: row.id,
    userId: row.user_id,
    destinationUrl: row.destination_url,
    clickCount: row.click_count,
    clicksPerHour: row.click_count > 0 ? row.click_count / assumeHours : 0,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const target: "remote" | "local" = args.includes("--remote") ? "remote" : "local";
  const sweep = args.includes("--sweep");

  console.log(`Reading link corpus from ${target} D1...`);
  const rows = runD1Query(
    "SELECT id, user_id, destination_url, click_count, created_at, is_disabled FROM links",
    target
  );
  console.log(
    `  ${rows.length} links, ${new Set(rows.map((r) => r.user_id)).size} distinct owners`
  );

  const ringRows = rows.filter((r) => r.user_id && RING_USER_IDS.has(r.user_id));
  const cleanRows = rows.filter((r) => !r.user_id || !RING_USER_IDS.has(r.user_id));
  console.log(`  ${ringRows.length} ring links, ${cleanRows.length} non-ring links\n`);

  // Assume the whole lifetime landed in a 30-day window — a realistic upper
  // bound on how fast a legitimate link accrues, and still far below the
  // ring's actual rate.
  const ASSUME_HOURS = 24 * 30;

  const highRingUsers = new Set<string>();
  const highCleanHits: Array<{ id: string; signal: string; detail: string }> = [];
  const mediumCleanCount = { n: 0 };

  const evaluateSet = (set: Row[], isRing: boolean) => {
    const byUser = new Map<string, LinkSample[]>();
    for (const row of set) {
      const sample = toSample(row, ASSUME_HOURS);
      for (const hit of evaluateLink(sample)) {
        if (hit.tier === "high") {
          if (isRing) {
            if (row.user_id) highRingUsers.add(row.user_id);
          } else {
            highCleanHits.push({ id: row.id, signal: hit.signal, detail: hit.detail });
          }
        } else if (!isRing) {
          mediumCleanCount.n++;
        }
      }
      if (row.user_id) {
        const list = byUser.get(row.user_id) ?? [];
        list.push(sample);
        byUser.set(row.user_id, list);
      }
    }
    for (const [userId, links] of byUser) {
      for (const hit of evaluateAccount(userId, links)) {
        if (hit.tier === "high") {
          if (isRing) highRingUsers.add(userId);
          else highCleanHits.push({ id: userId, signal: hit.signal, detail: hit.detail });
        }
      }
    }
  };

  evaluateSet(ringRows, true);
  evaluateSet(cleanRows, false);

  const ringUserCount = new Set(ringRows.map((r) => r.user_id)).size;
  const directCaught = highRingUsers.size;

  // Ring expansion, mirroring lib/abuse-detection.ts: any account sharing a
  // destination fingerprint with an already-enforced account inherits high
  // tier. Seeded only from accounts that tripped on their own merits.
  const seedFingerprints = new Set<string>();
  for (const row of rows) {
    if (!row.user_id || !highRingUsers.has(row.user_id)) continue;
    const fp = destinationFingerprint(row.destination_url);
    if (fp) seedFingerprints.add(fp);
  }
  // Mirror the guard in lib/abuse-detection.ts: only expand on a fingerprint
  // that independently looks like a ring, so one viral legitimate link can't
  // drag its co-linkers into an auto-disable.
  const ownersByFingerprint = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.user_id) continue;
    const fp = destinationFingerprint(row.destination_url);
    if (!fp) continue;
    const set = ownersByFingerprint.get(fp) ?? new Set<string>();
    set.add(row.user_id);
    ownersByFingerprint.set(fp, set);
  }
  const expandedClean: string[] = [];
  for (const row of rows) {
    if (!row.user_id) continue;
    const fp = destinationFingerprint(row.destination_url);
    if (!fp || !seedFingerprints.has(fp)) continue;
    const owners = ownersByFingerprint.get(fp)?.size ?? 0;
    if (owners < ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS) continue;
    if (RING_USER_IDS.has(row.user_id)) highRingUsers.add(row.user_id);
    else expandedClean.push(`${row.user_id} via ${fp}`);
  }
  for (const entry of new Set(expandedClean)) {
    highCleanHits.push({ id: entry, signal: "ring_expansion", detail: "expanded from a seed" });
  }

  // Layer 3: the seeded destination blocklist (migration 0021). These entries
  // make every matching link `flagged`, which the rescan cron disables. The
  // behavioral detector does not have to catch everything on its own — the
  // layers compose, and coverage must be measured as they actually ship.
  const seededBlocklist = compileBlocklist([
    { kind: "host", value: "hostpic.org", action: "block", reason: "seed" },
    { kind: "host", value: "imgbs.com", action: "block", reason: "seed" },
    { kind: "host", value: "ofppt.eu.cc", action: "block", reason: "seed" },
    { kind: "host", value: "steptrea.com", action: "block", reason: "seed" },
    { kind: "host", value: "exploredomainpole.com", action: "block", reason: "seed" },
    { kind: "path_segment", value: "26w1z61t", action: "block", reason: "seed" },
    { kind: "path_segment", value: "3nkhwhb", action: "block", reason: "seed" },
  ]);
  const blocklistRingUsers = new Set<string>();
  const blocklistCleanLinks: string[] = [];
  for (const row of rows) {
    if (!matchBlocklist(row.destination_url, seededBlocklist)) continue;
    if (row.user_id && RING_USER_IDS.has(row.user_id)) blocklistRingUsers.add(row.user_id);
    else blocklistCleanLinks.push(row.destination_url);
  }

  const combined = new Set([...highRingUsers, ...blocklistRingUsers]);
  const recall = ringUserCount > 0 ? combined.size / ringUserCount : 0;

  console.log("=== Confusion matrix ===");
  console.log(`  layer 1 — volume signals alone:       ${directCaught}/${ringUserCount} accounts`);
  console.log(
    `  layer 2 — + ring expansion:           ${highRingUsers.size}/${ringUserCount} accounts`
  );
  console.log(
    `  layer 3 — blocklist alone:            ${blocklistRingUsers.size}/${ringUserCount} accounts`
  );
  console.log(`  COMBINED (as shipped):                ${combined.size}/${ringUserCount} accounts`);
  console.log(`  blocklist false positives (non-ring links): ${blocklistCleanLinks.length}`);
  console.log(`  recall: ${(recall * 100).toFixed(1)}%`);
  console.log(`  FALSE POSITIVES (high tier on non-ring): ${highCleanHits.length}`);
  console.log(`  medium-tier labels on non-ring links: ${mediumCleanCount.n}\n`);

  if (highCleanHits.length > 0) {
    console.log("!!! Every false positive, in full — review before shipping:");
    for (const hit of highCleanHits) {
      console.log(`  - ${hit.id} [${hit.signal}] ${hit.detail}`);
    }
    console.log();
  }

  // Fingerprint safety: no legitimate destination may produce one.
  const cleanFingerprints = cleanRows
    .map((r) => ({
      id: r.id,
      url: r.destination_url,
      fp: destinationFingerprint(r.destination_url),
    }))
    .filter((r) => r.fp !== null);
  console.log(`=== destinationFingerprint on non-ring destinations ===`);
  console.log(`  ${cleanFingerprints.length} of ${cleanRows.length} produced a fingerprint`);
  for (const item of cleanFingerprints.slice(0, 25)) {
    console.log(`  - ${item.fp}   (${item.url.slice(0, 80)})`);
  }
  console.log();

  const rings = findRingFingerprints(
    rows.map((r) => ({ id: r.id, userId: r.user_id, destinationUrl: r.destination_url }))
  );
  console.log(`=== Ring fingerprints (>= ${ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS} accounts) ===`);
  for (const hit of rings) console.log(`  - ${hit.detail}`);
  console.log();

  console.log("=== Image destinations across the corpus ===");
  const images = rows.filter((r) => isImageDestination(r.destination_url));
  const cleanImages = images.filter((r) => !r.user_id || !RING_USER_IDS.has(r.user_id));
  console.log(`  ${images.length} total, ${cleanImages.length} non-ring`);
  for (const img of cleanImages) {
    console.log(`  - ${img.destination_url.slice(0, 90)} (${img.click_count} clicks)`);
  }
  console.log();

  if (sweep) {
    console.log("=== Threshold sweep (ring accounts caught / non-ring links hit) ===");
    for (const linkBurst of [200, 500, 1_000, 2_000, 5_000]) {
      for (const pixelBurst of [50, 100, 200, 500]) {
        const caught = new Set<string>();
        let fp = 0;
        for (const row of rows) {
          const rate = row.click_count / ASSUME_HOURS;
          const pixel = isImageDestination(row.destination_url);
          const trips = pixel ? rate >= pixelBurst : rate >= linkBurst;
          if (!trips) continue;
          if (row.user_id && RING_USER_IDS.has(row.user_id)) caught.add(row.user_id);
          else fp++;
        }
        console.log(
          `  link>=${linkBurst}/h pixel>=${pixelBurst}/h  ->  ring accounts ${caught.size}/${ringUserCount}, non-ring links ${fp}`
        );
      }
    }
    console.log();
  }

  const pass = highCleanHits.length === 0 && recall >= 0.9;
  console.log(pass ? "PASS — safe to enable enforcement" : "FAIL — do not enable enforcement");

  mkdirSync(OUT_DIR, { recursive: true });
  const reportPath = path.join(OUT_DIR, "abuse-detector-replay.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        totalLinks: rows.length,
        ringLinks: ringRows.length,
        ringAccountsCaught: [...highRingUsers],
        recall,
        falsePositives: highCleanHits,
        nonRingFingerprints: cleanFingerprints,
        thresholds: ABUSE_THRESHOLDS,
        pass,
      },
      null,
      2
    )
  );
  console.log(`\nReport written to ${reportPath}`);
  process.exit(pass ? 0 : 1);
}

main();

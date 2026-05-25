#!/usr/bin/env -S node --experimental-strip-types
/**
 * One-shot audit + kill script for brand-impersonating short links.
 *
 * Reads every active, non-archived row in `links`, runs each through the
 * same slug-abuse guard the API uses on the create path, and emits SQL to
 * disable any matches. Optionally executes the SQL via `wrangler d1 execute`.
 *
 * Usage:
 *   pnpm dlx tsx@latest scripts/disable-typosquat-slugs.ts --remote          # dry run
 *   pnpm dlx tsx@latest scripts/disable-typosquat-slugs.ts --apply --remote  # write to prod D1
 *   pnpm dlx tsx@latest scripts/disable-typosquat-slugs.ts --apply --local   # write to local D1
 *
 * Why a script instead of a migration: we want to review the matches before
 * committing to a disable, the brand list will evolve, and the GSC review
 * note needs an audit log of what we acted on.
 */

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSlugAbuse } from "../apps/api/src/lib/slug-abuse.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, ".audit");

interface LinkRow {
  id: string;
  domain: string;
  slug: string;
  destination_url: string;
  user_id: string | null;
  created_at: string;
}

interface Args {
  apply: boolean;
  target: "remote" | "local";
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const target: "remote" | "local" = args.includes("--remote") ? "remote" : "local";
  return { apply, target };
}

function runD1Query(sql: string, target: "remote" | "local"): LinkRow[] {
  const remoteFlag = target === "remote" ? "--remote" : "--local";
  const out = execFileSync(
    "wrangler",
    [
      "d1",
      "execute",
      "go2-db",
      remoteFlag,
      "--config",
      "apps/api/wrangler.toml",
      "--json",
      "--command",
      sql,
    ],
    { cwd: REPO_ROOT, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 },
  );
  const parsed = JSON.parse(out);
  const results = Array.isArray(parsed) ? parsed[0]?.results : parsed.results;
  return Array.isArray(results) ? results : [];
}

function runD1Statement(sql: string, target: "remote" | "local"): void {
  const remoteFlag = target === "remote" ? "--remote" : "--local";
  execFileSync(
    "wrangler",
    [
      "d1",
      "execute",
      "go2-db",
      remoteFlag,
      "--config",
      "apps/api/wrangler.toml",
      "--command",
      sql,
    ],
    { cwd: REPO_ROOT, stdio: "inherit" },
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  mkdirSync(OUT_DIR, { recursive: true });

  process.stdout.write(`> Scanning ${args.target} D1 for typosquat / brand-impersonating slugs…\n`);
  const rows = runD1Query(
    "SELECT id, domain, slug, destination_url, user_id, created_at FROM links WHERE COALESCE(is_archived, 0) = 0 AND COALESCE(is_disabled, 0) = 0",
    args.target,
  );
  process.stdout.write(`> Scanned ${rows.length} active links.\n`);

  const matches: Array<LinkRow & { reason: string; brand?: string }> = [];
  for (const row of rows) {
    const verdict = checkSlugAbuse(row.slug, row.destination_url);
    if (verdict.blocked) {
      matches.push({ ...row, reason: verdict.reason ?? "blocked", brand: verdict.brand });
    }
  }

  const reportPath = path.join(OUT_DIR, `typosquat-audit-${args.target}-${Date.now()}.csv`);
  const csvLines = ["id,domain,slug,destination_url,user_id,brand,reason,created_at"];
  for (const m of matches) {
    csvLines.push(
      [
        m.id,
        m.domain,
        m.slug,
        m.destination_url,
        m.user_id ?? "",
        m.brand ?? "",
        JSON.stringify(m.reason),
        m.created_at,
      ].join(","),
    );
  }
  writeFileSync(reportPath, csvLines.join("\n"));
  process.stdout.write(`> Found ${matches.length} typosquat / brand-impersonating slugs.\n`);
  process.stdout.write(`> Audit written to ${path.relative(REPO_ROOT, reportPath)}\n`);

  if (matches.length === 0) {
    process.stdout.write("> Nothing to disable.\n");
    return;
  }

  for (const m of matches.slice(0, 20)) {
    process.stdout.write(
      `  ${m.domain}/${m.slug}  →  ${m.destination_url}  ::  ${m.brand ?? "?"}  ::  ${m.reason}\n`,
    );
  }
  if (matches.length > 20) {
    process.stdout.write(`  … and ${matches.length - 20} more in the CSV.\n`);
  }

  if (!args.apply) {
    process.stdout.write("\n> Dry run — re-run with --apply to disable.\n");
    return;
  }

  process.stdout.write(`\n> Disabling ${matches.length} links on ${args.target} D1…\n`);
  const now = new Date().toISOString();
  for (let i = 0; i < matches.length; i += 50) {
    const chunk = matches.slice(i, i + 50);
    const ids = chunk.map((m) => `'${m.id.replace(/'/g, "''")}'`).join(",");
    const reason = `typosquat_audit:${chunk[0].brand ?? "brand_impersonation"}`;
    const sql = `UPDATE links SET is_disabled = 1, disabled_at = '${now}', disabled_reason = '${reason}', updated_at = '${now}' WHERE id IN (${ids})`;
    runD1Statement(sql, args.target);
  }
  process.stdout.write(`> Disabled ${matches.length} links.\n`);

  // Update each slug's KV entry with a disabled marker (NOT delete) so the
  // resolver renders renderDisabledPage() with a clear 410 Gone + explanation
  // — deleting would result in a generic 404, which is regression for GSC
  // review (looks like the URL was never there).
  process.stdout.write("> Updating LINKS_KV entries with disabled markers…\n");
  const defaultReason = `typosquat_audit:${matches[0].brand ?? "brand_impersonation"}`;
  for (const m of matches) {
    const key = `${m.domain}:${m.slug}`;
    const cached = {
      id: m.id,
      destinationUrl: m.destination_url,
      domain: m.domain,
      slug: m.slug,
      isDisabled: true,
      disabledReason: m.reason || defaultReason,
      threatStatus: "flagged",
    };
    const body = JSON.stringify(cached);
    try {
      execFileSync(
        "wrangler",
        [
          "kv",
          "key",
          "put",
          key,
          body,
          "--namespace-id",
          "cc18f3e6b3a7457ea6fe5186dd32686a",
          args.target === "remote" ? "--remote" : "--local",
          "--config",
          "apps/api/wrangler.toml",
        ],
        { cwd: REPO_ROOT, stdio: "ignore" },
      );
    } catch {
      // Best-effort — abuse review can re-run the script.
    }
  }
  process.stdout.write("> KV update complete.\n");

  // Suppress unused execSync import (kept for ad-hoc shell use)
  void execSync;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

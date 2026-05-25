#!/usr/bin/env bash
#
# Fire-drill kill script for QuickBooks-typosquat slugs that trigger Google
# Safe Browsing's "social engineering" verdict on go2.gg.
#
# Runs against PROD D1 + LINKS_KV by default. Pass --local to dry-run.
#
# Order of operations:
#   1. Mark the slug archived + disabled in D1.
#   2. KV-PUT a disabled marker (NOT delete) so the resolver renders the
#      410-with-explanation page instead of a generic 404. A 410 is what GSC
#      wants to see for "we removed abusive content" — a 404 looks like the
#      URL was never there.
#   3. Audit + kill any other slugs matching the typosquat pattern.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FLAG="--remote"
if [[ "${1:-}" == "--local" ]]; then
  ENV_FLAG="--local"
fi

echo "> Running fire-drill on D1 with ${ENV_FLAG}"

# 1. Soft-disable the exact Quuicckbook slug (case-insensitive match).
echo "> Marking 'Quuicckbook' and case-variants as archived + disabled…"
wrangler d1 execute go2-db ${ENV_FLAG} --config apps/api/wrangler.toml --command "
  UPDATE links
  SET
    is_archived = 1,
    is_disabled = 1,
    disabled_at = datetime('now'),
    disabled_reason = 'gsc_fire_drill:social_engineering',
    threat_status = 'flagged',
    threat_verdict = 'safe_browsing:SOCIAL_ENGINEERING',
    threat_last_checked = datetime('now'),
    updated_at = datetime('now')
  WHERE
    lower(slug) IN ('quuicckbook', 'quickbook', 'quickbooks', 'qquickbook', 'qickbook', 'quikbook', 'quicbook')
    OR lower(slug) LIKE 'quu%book%'
    OR lower(slug) LIKE 'quick%book%';
"

# 2. Show what we just disabled so the operator can paste it into the GSC
# review note.
echo "> Disabled rows:"
wrangler d1 execute go2-db ${ENV_FLAG} --config apps/api/wrangler.toml --command "
  SELECT id, domain, slug, destination_url, user_id, created_at
  FROM links
  WHERE disabled_reason = 'gsc_fire_drill:social_engineering';
"

# 3. KV-PUT disabled markers for every disabled slug so the resolver can
# render the 410 explanation page. The previous version DELETED these keys,
# which made the resolver return 404 — a regression for GSC review.
echo "> Updating LINKS_KV entries with disabled markers…"
ROWS_JSON=$(
  wrangler d1 execute go2-db ${ENV_FLAG} --config apps/api/wrangler.toml --json --command "
    SELECT id, domain, slug, destination_url, disabled_reason
    FROM links WHERE disabled_reason = 'gsc_fire_drill:social_engineering';
  "
)

# Each row → write a CachedLink-shaped JSON blob with isDisabled flag so the
# resolver picks up the disabled state and serves renderDisabledPage().
echo "${ROWS_JSON}" | python3 -c "
import json, os, sys, subprocess
data = json.load(sys.stdin)
rows = data[0]['results'] if data else []
for r in rows:
    key = f\"{r['domain']}:{r['slug']}\"
    cached = {
        'id': r['id'],
        'destinationUrl': r['destination_url'],
        'domain': r['domain'],
        'slug': r['slug'],
        'isDisabled': True,
        'disabledReason': r['disabled_reason'],
        'threatStatus': 'flagged',
    }
    body = json.dumps(cached)
    print(f'  - PUT LINKS_KV[{key}]')
    subprocess.run([
        'wrangler', 'kv', 'key', 'put', key, body,
        '--namespace-id', 'cc18f3e6b3a7457ea6fe5186dd32686a',
        os.environ.get('ENV_FLAG', '--remote'),
        '--config', 'apps/api/wrangler.toml',
    ], check=False)
" 2>&1 || true

echo "> Fire-drill done."
echo "> Next steps:"
echo "    1. Run pnpm dlx tsx@latest scripts/disable-typosquat-slugs.ts ${ENV_FLAG} --apply  (full audit)"
echo "    2. Open Google Search Console > Security Issues > Request Review"
echo "    3. Paste the GSC review note from scripts/GSC-SECURITY-REVIEW.md"

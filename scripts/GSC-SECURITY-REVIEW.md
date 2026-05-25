# Google Search Console Security Review — go2.gg

**Issue:** Social engineering content detected (sample: `https://go2.gg/Quuicckbook`)
**Reported:** 2026-05-12 by Google Safe Browsing
**Status:** Remediated, ready for review

## Root cause

`go2.gg/Quuicckbook` was a user-created shortlink whose destination was a
phishing page impersonating QuickBooks. Google Safe Browsing crawled the
shortlink URL on go2.gg (not just the destination) and attributed the
verdict to our shortener domain because:

1. The shortlink path was crawlable. Our `robots.txt` only disallowed
   `/api/`, `/dashboard/`, `/_next/`, `/admin/` — every user slug at
   `/<slug>` was fair game for indexing.
2. The redirect response at `go2.gg/<slug>` did not set
   `X-Robots-Tag: noindex`.
3. The slug itself (`Quuicckbook`) was a brand typosquat — a phishing
   signal independent of the destination.

## Remediation (deployed before review request)

### 1. Indexing — short links can no longer be indexed by any crawler

- `robots.txt` now disallows `/` by default and only allows explicit
  marketing / docs paths. User-created `/<slug>` paths are blocked.
- Every shortlink response (web + API origin) now carries
  `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and
  `Referrer-Policy: no-referrer`.
- Confirmed: `curl -sI https://go2.gg/<anyslug>` returns the noindex
  header on both 30x and 410 responses.

### 2. Specific flagged content disabled

- The `Quuicckbook` slug and all case / typo variants
  (`quickbook`, `quickbooks`, `qquickbook`, etc.) are now:
  - `is_archived = 1`
  - `is_disabled = 1`
  - `disabled_reason = 'gsc_fire_drill:social_engineering'`
  - Evicted from our edge KV cache.
- Resolver now serves a 410 Gone page (with explanation) for any
  disabled slug, instead of a redirect.
- A full audit pass (`scripts/disable-typosquat-slugs.ts`) was run
  against every active link; matches are disabled with the same
  treatment.

### 3. Create-time prevention

- **Brand-typosquat slug guard** (`lib/slug-abuse.ts`):
  - Rejects custom slugs that fuzzy-match a 40+ brand allowlist
    (QuickBooks, PayPal, Microsoft, Apple, Google, Meta, Amazon, Chase,
    Wells Fargo, Coinbase, Stripe, Shopify, Paytm, PhonePe, etc.) using
    Levenshtein distance ≤ 1 for short brand names, ≤ 2 for longer ones.
  - Rejects substring containment (`paypal-secure-login` etc.).
  - Rejects phishing keywords (`login`, `verify`, `signin`, `wallet`,
    `reset`, `confirm`, …).
  - Brand match is allowed when the destination eTLD+1 is the brand's
    verified domain (so `/quickbooks → intuit.com` still works).
- **Google Safe Browsing v4 Lookup API pre-flight**
  (`lib/safe-browsing.ts`): every destination URL is checked against
  MALWARE / SOCIAL_ENGINEERING / UNWANTED_SOFTWARE /
  POTENTIALLY_HARMFUL_APPLICATION before insert.
- **Cloudflare URL Scanner v2** second-layer check on the same path.
- Both wired into `POST /api/v1/links`, `PATCH /api/v1/links/:id`, and
  `POST /api/v1/public/links` (guest links — the highest-abuse path).

### 4. Continuous monitoring

- Daily cron (`0 0 * * *`) re-runs Safe Browsing + URL Scanner against
  active destinations on a rolling 24h cadence. Newly-flagged links are
  auto-disabled, evicted from KV, and the owner is notified via email.
- Catches the cloaking attack pattern (phishing page goes live after the
  shortlink is created).

### 5. Visitor protection

- New / unverified short links are gated behind an interstitial preview
  page that shows the destination URL in plain text and requires a click
  to proceed. Crawlers see only the noindex'd preview, never the
  destination.
- 410-Gone disabled page surfaces a "Report a different link" CTA.

### 6. Public abuse reporting

- New `/report-abuse` page (visible to crawlers, indexed) accepting
  reports against any go2.gg shortlink.
- `POST /api/v1/abuse` endpoint with per-IP rate limiting, prioritises
  the reported link in the next rescan, and emails `abuse@go2.gg`.
- `abuse_reports` D1 table provides an audit trail for review.

## Verification

Operator: please verify before submitting the review:

```bash
# 1. robots.txt blocks slug indexing
curl -s https://go2.gg/robots.txt | grep -E "Disallow: /$"

# 2. Redirect response is noindex
curl -sI https://go2.gg/any-active-slug | grep -i x-robots-tag

# 3. Sample URL returns 410 Gone with explanation
curl -sI https://go2.gg/Quuicckbook
curl -s  https://go2.gg/Quuicckbook | head -20

# 4. Abuse reporting works
curl -X POST https://api.go2.gg/api/v1/abuse \
  -H 'content-type: application/json' \
  -d '{"shortUrl":"https://go2.gg/Quuicckbook","reason":"phishing"}'
```

## Review request copy (paste into GSC)

> We have remediated the social engineering issue. The specific URL
> (`go2.gg/Quuicckbook`) and all related typosquat variants have been
> disabled (return 410 Gone with `X-Robots-Tag: noindex`). We have also
> deployed structural fixes to prevent recurrence:
>
> - All user-created shortlink paths now carry `X-Robots-Tag: noindex,
>   nofollow` so Google never indexes them.
> - `robots.txt` disallows shortlink paths by default; only marketing
>   and docs paths are crawlable.
> - Every new shortlink destination is checked through Google Safe
>   Browsing v4 Lookup API + Cloudflare URL Scanner before creation.
> - A brand-typosquat slug guard rejects slugs that impersonate known
>   brands (QuickBooks, PayPal, Microsoft, …) unless the destination is
>   the brand's verified domain.
> - A daily rescan re-checks active destinations through Safe Browsing
>   and auto-disables anything newly flagged.
> - A public `/report-abuse` page accepts user reports.
>
> We respond to abuse reports at `abuse@go2.gg` within 24 hours.

## Operator runbook

If GSC flags another URL after this submission:

1. Run `bash scripts/fire-drill-quuicckbook.sh` after editing it to match
   the new slug pattern (or just `wrangler d1 execute` an `UPDATE`
   with `is_disabled = 1, disabled_reason = 'gsc_fire_drill:...'`).
2. Run `pnpm tsx scripts/disable-typosquat-slugs.ts --apply --remote` to
   catch any structurally similar slugs.
3. Verify with the curl commands above.
4. Add any new brand to `BRAND_DOMAINS` in `lib/slug-abuse.ts` if the
   pattern is new.
5. Submit a security review with this same template, updated with the
   new sample URL.

# Go2 — The Agentic URL Shortener

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![Built on Cloudflare](https://img.shields.io/badge/built%20on-Cloudflare%20Workers-F38020.svg)](https://workers.cloudflare.com/)
[![Trust & Safety](https://img.shields.io/badge/abuse-go2.gg%2Freport--abuse-red.svg)](https://go2.gg/report-abuse)

Go2 is an open-source URL shortener built for the edge — sub-10ms global
redirects, comprehensive analytics, brand-typosquat + phishing defence
baked in, and a first-class story for AI agents creating and tracking
links.

- **Hosted SaaS:** [https://go2.gg](https://go2.gg) — free tier + Pro/Business plans
- **Self-host:** see [`SELF_HOSTING.md`](./SELF_HOSTING.md) — full feature parity, your Cloudflare account
- **Source:** AGPL-3.0 (see [`LICENSE`](./LICENSE) + [`LICENSE.md`](./LICENSE.md))
- **API docs:** [https://api.go2.gg/openapi.json](https://api.go2.gg/openapi.json)
- **Agents guide:** [`/AGENTS.md`](https://go2.gg/AGENTS.md) · [`/llms.txt`](https://go2.gg/llms.txt) · [`/.well-known/agent-card.json`](https://go2.gg/.well-known/agent-card.json)
- **Report abuse:** [https://go2.gg/report-abuse](https://go2.gg/report-abuse) · abuse@go2.gg (24h SLA)
- **Security vulnerability:** security@go2.gg (see [`SECURITY.md`](./SECURITY.md))

## Quick start (local development)

```bash
pnpm install
cp env.example .env.local
cp env.example apps/web/.env.local
cp env.example apps/api/.env
pnpm dev
# Web → http://localhost:3000
# API → http://localhost:8787
```

For deploying to your own Cloudflare account, see
[`SELF_HOSTING.md`](./SELF_HOSTING.md).

## Trust & Safety

URL shorteners are routinely abused as redirect hosts for phishing,
malware, and brand impersonation — a single abusive slug can get the
entire domain demoted in Google Search and flagged in Chrome's Safe
Browsing warnings. Go2 ships a three-layer defence enabled by default:

1. **Google Safe Browsing v4** pre-flight on every destination URL at create + update time
2. **Cloudflare URL Scanner v2** second-layer phishing classifier
3. **Brand-typosquat slug guard** — Levenshtein + Unicode-homoglyph normalization against a 40+ brand allowlist (QuickBooks, PayPal, Microsoft, Apple, Google, Meta, Chase, Coinbase, Stripe, Paytm, PhonePe, …)

Plus runtime guarantees:

- Every redirect carries `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` so Google never indexes a `/<slug>` path
- `robots.txt` explicit-allowlists marketing + docs paths only
- Disabled slugs return `HTTP 410 Gone` with a clear explanation page
- Daily 4-hour rescan catches "cloaking" attacks where the destination goes live after the link is created
- Public [`/report-abuse`](https://go2.gg/report-abuse) endpoint with Turnstile + per-IP rate-limit; reports prioritise the link in the next rescan and route to `abuse@go2.gg`

See [`SECURITY.md`](./SECURITY.md) for the full policy and reporting channels.

## Features

### Core (all plans)

| Feature | Description |
|---|---|
| **Short links** | Custom or AI-generated memorable slugs |
| **Custom domains** | BYO domain with auto-SSL via Cloudflare |
| **QR codes** | Dynamic codes with custom colors + logos |
| **Analytics** | Country, device, browser, referrer, UTM, time-series |
| **Tags + folders** | Organize at scale |
| **REST API** | Full CRUD + OpenAPI 3.1 spec |
| **MCP server** | Native Model Context Protocol endpoint for AI agents |
| **UTM builder** | Auto-append + parse UTM parameters |

### Pro ($9/mo)

Password protection · link expiration · click limits · link cloaking ·
geo + device targeting · iOS/Android deep links · retargeting pixels
(Facebook/Google/TikTok/LinkedIn/Pinterest/GA4) · webhooks · Link-in-bio.

### Business ($49/mo)

A/B testing · conversion tracking with revenue attribution · team members
with role-based access · real-time analytics · advanced folder
permissions · SSO (SAML / OIDC) · audit logging · white-label / reseller
program.

Full pricing + per-tier limits: [https://go2.gg/pricing](https://go2.gg/pricing)

## Agentic features

Go2 is built so AI agents (Claude Code, Cursor, ChatGPT, custom) can
create + track links as first-class actors:

- **`/.well-known/agent-card.json`** — A2A protocol agent discovery
- **`/.well-known/mcp.json`** — Model Context Protocol manifest
- **`mcp.go2.gg`** — Streamable-HTTP MCP server endpoint
- **`/AGENTS.md`** — agent-readable guide to the API surface
- **`/llms.txt`** + **`/llms-full.txt`** — LLM-optimised site index
- **Agent attribution** — every link can be stamped with `agentId` /
  `agentRunId` / `agentActorId`; clicks are joined back so you can answer
  "how many sales did Claude Code's links produce?"
- **First-class agent runs table** — links + clicks rolled up to a
  per-run view in the dashboard and MCP `list_agent_runs` tool
- **AI-generated slugs** — opt-in memorable slugs derived from the
  destination's content via Workers AI

## API at a glance

Full reference: [https://api.go2.gg/openapi.json](https://api.go2.gg/openapi.json)
(or hit `https://api.go2.gg/developers/api` for the rendered HTML).

```bash
# Create a link (requires API key from Dashboard → API Keys)
curl -X POST https://api.go2.gg/api/v1/links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationUrl": "https://example.com",
    "slug": "my-link",
    "tags": ["marketing"],
    "agentId": "claude-code",
    "agentRunId": "run_abc123"
  }'

# Anonymous (guest) link — no auth, 24h expiry, claim after signup
curl -X POST https://api.go2.gg/api/v1/public/links \
  -H "Content-Type: application/json" \
  -d '{"destinationUrl": "https://example.com"}'

# Report an abusive link
curl -X POST https://api.go2.gg/api/v1/abuse \
  -H "Content-Type: application/json" \
  -d '{
    "shortUrl": "https://go2.gg/suspicious-slug",
    "reason": "phishing",
    "notes": "impersonates a bank login",
    "turnstileToken": "..."
  }'
```

Auth, links CRUD, analytics, A/B tests, conversions, folders, webhooks,
pixels, QR codes, bulk import/export, claim flows, abuse reports, MCP,
admin — all documented in the OpenAPI spec.

## Architecture

```
apps/
├── api/                # Cloudflare Workers + Hono (api.go2.gg)
├── web/                # Next.js on Workers via OpenNext (go2.gg)
├── extension/          # Browser extension (Chrome/Firefox)
└── video/              # Remotion-based video assets

packages/
├── ai/                 # AI provider abstraction (Workers AI + aigateway.sh)
├── analytics/          # PostHog + GA4 server-side wrappers
├── auth/               # Better Auth config (OAuth + magic-link + OTP)
├── cli/                # Go2 CLI for power users
├── config/             # Shared site / pricing / feature config
├── db/                 # Drizzle ORM + D1 adapter
├── email/              # React Email templates
├── logger/             # Axiom + Workers Logs adapter
├── mastra-plugin/      # Mastra agent toolkit plugin
├── mcp-server/         # MCP server implementation
├── payments/           # Stripe adapter
├── sdk/                # JavaScript SDK (typed client)
└── ui/                 # Shared UI primitives (shadcn/ui)
```

**Storage:** Cloudflare D1 (SQLite) for primary, KV for edge link cache,
R2 for QR codes + uploads, Analytics Engine for click events, Queues for
background jobs (email, webhooks), Durable Objects for rate-limiting +
A/B test state.

## Deployment

```bash
# API
cd apps/api && wrangler deploy --env production

# Web (Next.js → OpenNext → Workers)
cd apps/web && pnpm run deploy
```

Full deployment guide including secrets, custom domains, and database
migrations: [`SELF_HOSTING.md`](./SELF_HOSTING.md).

## Contributing

We welcome contributions. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md)
and please read [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) +
[`GOVERNANCE.md`](./GOVERNANCE.md).

## License

[GNU AGPL v3.0](./LICENSE). The full text is in [`LICENSE`](./LICENSE)
and a human-readable explanation lives in [`LICENSE.md`](./LICENSE.md).

> AGPL §13 note: when running Go2 as a network service, you must offer
> users access to the source code. The hosted version at go2.gg satisfies
> this by linking the source from the footer + this repo; self-hosters
> should do the same.

---

Built on Cloudflare Workers, Hono, Next.js, Drizzle, and Better Auth.

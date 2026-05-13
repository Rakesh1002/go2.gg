<div align="center">

<a href="https://go2.gg">
  <img src="https://go2.gg/og-image.png" alt="Go2 — The Agentic URL Shortener" width="100%">
</a>

<br />

# Go2 — The Agentic URL Shortener

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Rakesh1002/go2.gg?style=social)](https://github.com/Rakesh1002/go2.gg)
[![Built on Cloudflare](https://img.shields.io/badge/built%20on-Cloudflare%20Workers-F38020.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Trust & Safety](https://img.shields.io/badge/abuse-go2.gg%2Freport--abuse-red.svg)](https://go2.gg/report-abuse)

**Branded short links your team controls — and an MCP server your AI agent can use.**
Sub-10ms global redirects, phishing-resistant by default, attribution that
tracks every click back to the human *or* the agent that created the link.

[**Try go2.gg free →**](https://go2.gg/register) &nbsp; [**Install MCP server →**](https://go2.gg/agents) &nbsp; [**Read the docs →**](https://go2.gg/docs)

</div>

---

## Built for three audiences

**Marketers & growth teams.** Branded short links on your own domain.
Click analytics by country, device, and referrer. UTM builder, retargeting
pixels (Facebook / Google / TikTok / LinkedIn / Pinterest / GA4), A/B
testing, conversion tracking with revenue attribution — without the bit.ly
tax.

**Developers.** A REST API and typed SDK that don't require an account
just to try. Anonymous "guest" links work in one curl call. Full OpenAPI
3.1 spec at [/openapi.json](https://go2.gg/openapi.json). Custom domains
with auto-SSL via Cloudflare. Webhooks for every event you care about.

**AI agents — first-class.** Native MCP server at `mcp.go2.gg`. Every
link can be stamped with `agentId` / `agentRunId`, and clicks are joined
back so you can answer *"how many sales did Claude Code's links produce?"*
Agent-readable surfaces at [`/AGENTS.md`](https://go2.gg/AGENTS.md),
[`/llms.txt`](https://go2.gg/llms.txt),
[`/.well-known/agent-card.json`](https://go2.gg/.well-known/agent-card.json),
[`/.well-known/mcp.json`](https://go2.gg/.well-known/mcp.json).

---

## Why Go2

- **Agent-native.** First shortener where AI agents are a first-class actor — MCP server, per-agent attribution, run rollups in the dashboard.
- **Phishing-resistant.** Every destination is checked through Google Safe Browsing + Cloudflare URL Scanner *before* the link is created; typosquats of QuickBooks, PayPal, Coinbase, Microsoft, and 40+ other brands are blocked at slug-time.
- **Sub-10ms global.** Runs on Cloudflare Workers — redirects served from the nearest of 300+ edge cities, no cold starts.
- **Open source, AGPL-3.0.** Every prod commit mirrors to this public repo within 30 seconds. Use the hosted version at [go2.gg](https://go2.gg) or self-host on your own Cloudflare account.

---

## How it works

**1. Add your domain (or use go2.gg).** Point a single DNS record at
Cloudflare and your branded short links are live with auto-SSL. Or skip
it and use `go2.gg/...` — anonymous and account-bound links work out of
the box.

**2. Create links — anywhere.** From the dashboard, the REST API, or
your AI agent via MCP. Add custom slugs, QR codes, retargeting pixels,
password protection, and A/B variants per link.

**3. See every click.** Real-time analytics — geo, device, browser,
referrer, UTM. Export to CSV. Your data, your dashboard, no paywall on
your own traffic.

---

## Show me

**Create a link via API:**

```bash
curl -X POST https://api.go2.gg/api/v1/links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationUrl": "https://example.com/launch",
    "slug": "launch-2026",
    "tags": ["marketing"]
  }'
```

**Wire up an AI agent via MCP (Claude Code, Cursor, etc.):**

```bash
claude mcp add go2 --transport http https://mcp.go2.gg
# Your agent now has create_link, get_stats, list_agent_runs, …
```

**No account? One-line guest link with 24h expiry:**

```bash
curl -X POST https://api.go2.gg/api/v1/public/links \
  -H "Content-Type: application/json" \
  -d '{"destinationUrl": "https://example.com"}'
# → { "shortUrl": "https://go2.gg/wq3F2", "expiresAt": "...", "claimable": true }
```

Full reference: [**go2.gg/docs**](https://go2.gg/docs).

---

## Trust & safety

Your visitors won't see phishing or malware on your domain. Three layers
of defence run on every link create, every update, and on a rolling
4-hour rescan:

- **Google Safe Browsing v4** — destinations are checked against malware, social engineering, and unwanted-software lists before the link is created.
- **Cloudflare URL Scanner v2** — second-layer phishing classifier; catches what Safe Browsing hasn't seen yet.
- **Brand-typosquat slug guard** — rejects Unicode-homoglyph + Levenshtein-near matches of 40+ brand names unless the destination is the brand's verified domain.

Disabled links return `HTTP 410 Gone` with an explanation page, never
auto-follow. Every redirect carries `X-Robots-Tag: noindex` so Google
never indexes a slug path. Anyone can report a bad link at
[**go2.gg/report-abuse**](https://go2.gg/report-abuse) — reviewed within
24 hours.

Full policy in [SECURITY.md](./SECURITY.md). Security vulnerabilities
go to **security@go2.gg**; abusive content reports to **abuse@go2.gg**.

---

## Pricing

Free for 100 links a month, no credit card. Pro ($9/mo) unlocks custom
domains, more retention, and Pro features. Business ($49/mo) adds team
seats, SSO, A/B testing, and conversion attribution. Full breakdown at
[**go2.gg/pricing**](https://go2.gg/pricing).

---

## Self-host

Want to run Go2 on your own Cloudflare account? Full feature parity, your
data stays on your infrastructure, AGPL-3.0 license. Step-by-step in
[**SELF_HOSTING.md**](./SELF_HOSTING.md) — typical setup is 30 minutes
including DNS.

---

## For contributors

We welcome contributions. Start with [CONTRIBUTING.md](./CONTRIBUTING.md)
and read the [Code of Conduct](./CODE_OF_CONDUCT.md) and
[Governance](./GOVERNANCE.md).

<details>
<summary><b>Local development quick start</b></summary>

```bash
pnpm install
cp env.example .env.local
cp env.example apps/web/.env.local
cp env.example apps/api/.env
pnpm dev
# Web → http://localhost:3000
# API → http://localhost:8787
```
</details>

<details>
<summary><b>Architecture</b></summary>

```
apps/
├── api/                # Cloudflare Workers + Hono (api.go2.gg)
├── web/                # Next.js on Workers via OpenNext (go2.gg)
├── extension/          # Browser extension (Chrome/Firefox)
└── video/              # Remotion-based video assets

packages/
├── ai/                 # AI provider abstraction
├── analytics/          # PostHog + GA4 server-side
├── auth/               # Better Auth config (OAuth + magic-link + OTP)
├── cli/                # Go2 CLI
├── config/             # Shared site / pricing / feature config
├── db/                 # Drizzle ORM + D1 adapter
├── email/              # React Email templates
├── logger/             # Axiom + Workers Logs
├── mastra-plugin/      # Mastra agent toolkit plugin
├── mcp-server/         # MCP server implementation
├── payments/           # Stripe adapter
├── sdk/                # Typed JavaScript SDK
└── ui/                 # Shadcn/ui primitives
```

**Storage:** Cloudflare D1 (SQLite) for primary, KV for the edge link
cache, R2 for QR codes and uploads, Analytics Engine for click events,
Queues for background jobs, Durable Objects for rate-limiting and A/B
test state.

**Stack:** Hono, Next.js (App Router on Workers via OpenNext), Drizzle
ORM, Better Auth, React Email, Stripe.
</details>

---

## License

[GNU AGPL v3.0](./LICENSE). Plain-English summary in
[LICENSE.md](./LICENSE.md).

> **AGPL §13 note.** When you run Go2 as a network service, you must
> offer your users access to your modified source. The hosted version
> at [go2.gg](https://go2.gg) links this repo from the footer;
> self-hosters should do the same.

---

Built on Cloudflare Workers, Hono, Next.js, Drizzle, and Better Auth.
Made with care by [@Rakesh1002](https://github.com/Rakesh1002).

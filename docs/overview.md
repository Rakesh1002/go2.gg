# Go2 — Overview

> **One-liner:** Branded short links your team controls — plus a native MCP server so AI agents can create, attribute, and measure links as first-class actors.

The single cold-start doc. A teammate should read this and know what this is, how to
run it, and the decisions that shaped it — in under 30 minutes.

## What & why
- **Problem:** Existing URL shorteners (Bitly, etc.) charge a tax on your own traffic, aren't phishing-resistant by default, and have no concept of an AI agent as the creator of a link. As agents start taking real actions on the web, there is no link/attribution/click primitive built for them.
- **Who it's for:** Marketers & growth teams (branded links + click analytics), developers (REST API + typed SDK, no account needed to try), and AI agents (native MCP server with per-agent / per-run attribution).
- **What we're building:** An agentic URL shortener on Cloudflare Workers. Sub-10ms global redirects, phishing-resistant by default (Google Safe Browsing + Cloudflare URL Scanner + brand-typosquat guard), and attribution that ties every click back to the human *or* the agent that created the link. Hosted at go2.gg, AGPL-3.0, self-hostable on your own Cloudflare account.
- **Stage:** active
- **Status right now:** Hosted product live at go2.gg with web app, REST API, MCP server, SDK, and browser extension in the monorepo. Prod commits mirror to the public repo within ~30s.

## How to run it
```bash
pnpm install
cp env.example .env.local
cp env.example apps/web/.env.local
cp env.example apps/api/.env
pnpm dev
# Web → http://localhost:3000
# API → http://localhost:8787
```
First-time full setup (install + migrate dev DB + seed):
```bash
pnpm setup
```
- **Prod URL:** https://go2.gg (API: https://api.go2.gg · MCP: https://mcp.go2.gg)
- **Repo:** https://github.com/Rakesh1002/go2.gg
- **Deploy:** Cloudflare Workers via wrangler/OpenNext. `pnpm deploy:production` (= `deploy:api` + `deploy:web`); staging via `pnpm deploy:staging`. API deploys with `wrangler deploy --env production`; web builds with OpenNext then deploys `.open-next/worker.js`.

## Where things are
| Area | Location |
|------|----------|
| Frontend / app | `apps/web/` (Next.js App Router on Workers via OpenNext) |
| Backend / API | `apps/api/` (Cloudflare Workers + Hono) |
| MCP server | `packages/mcp-server/` |
| SDK | `packages/sdk/` (typed JavaScript SDK) |
| Browser extension | `apps/extension/` (Chrome/Firefox) |
| Video assets | `apps/video/` (Remotion) |
| DB schema / ORM | `packages/db/` (Drizzle ORM + D1 adapter) |
| Infra / config | `infra/`, `packages/config/`, `wrangler` configs per app |
| Docs / blog content | `content/docs/`, `content/blog/` (MDX) |
| Tests | colocated within each app/package |

## Top 5 decisions to know
1. Cloudflare Workers everywhere (D1, KV, R2, Analytics Engine, Queues, Durable Objects) — for sub-10ms global redirects with no cold starts. → [[Decisions DB]]
2. Agent-native by design — MCP server at `mcp.go2.gg`, `agentId`/`agentRunId` stamped on links, clicks joined back for per-run attribution.
3. Phishing-resistant by default — Google Safe Browsing v4 + Cloudflare URL Scanner v2 + brand-typosquat slug guard run on every create/update and a rolling 4-hour rescan.
4. AGPL-3.0 + public-mirror — every prod commit mirrors to the public repo within ~30s; hosted or self-host on your own Cloudflare account.
5. TypeScript-first pnpm + Turbo monorepo with Biome — Hono, Next.js, Drizzle, Better Auth, React Email, Stripe.

## Key links
- **Linear:** {prompt: add Linear project URL} · **Dashboards:** {prompt: add analytics/PostHog/GA4 dashboard URL}
- **Strategy:** [[thesis]] · **Architecture:** [[architecture]] · **GTM:** [[positioning]]
- **Agent surfaces:** https://go2.gg/AGENTS.md · https://go2.gg/llms.txt · https://go2.gg/.well-known/agent-card.json · https://go2.gg/.well-known/mcp.json · https://go2.gg/openapi.json
- **Docs:** https://go2.gg/docs

---
**Owner:** Rakesh Roushan · **Last reviewed:** 2026-06-21 · **Review by:** 2026-09-21

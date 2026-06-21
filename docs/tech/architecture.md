# Go2 — Architecture

## System overview
Go2 is a TypeScript pnpm + Turbo monorepo running entirely on Cloudflare Workers. A Hono API (`api.go2.gg`) and a Next.js App Router web app on Workers via OpenNext (`go2.gg`) sit in front of Cloudflare storage primitives. Redirects are served from KV at the nearest of 300+ edge cities for sub-10ms, no-cold-start latency; clicks stream into Analytics Engine and are joined back to the human or agent (`agentId`/`agentRunId`) that created the link. A native MCP server (`mcp.go2.gg`) exposes link tools to AI agents.

```
                 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   humans  ───▶  │  web (go2.gg)│   │ API          │   │ MCP server   │  ◀── AI agents
                 │  Next.js/    │──▶│ (api.go2.gg) │◀──│ (mcp.go2.gg) │
                 │  OpenNext    │   │ Hono/Workers │   │              │
                 └──────────────┘   └──────┬───────┘   └──────────────┘
                                           │
        ┌──────────┬───────────┬───────────┼───────────┬──────────────┐
        ▼          ▼           ▼           ▼           ▼              ▼
      D1(SQLite)  KV(link     R2(QR/      Analytics   Queues(bg     Durable Objects
      primary     cache,      uploads)    Engine      jobs)         (rate-limit,
      store       edge)                   (clicks)                  A/B state)
```

## Components
| Component | Responsibility | Tech |
|-----------|----------------|------|
| `apps/web` | Dashboard, marketing site, redirect UX | Next.js App Router on Workers (OpenNext) |
| `apps/api` | REST API, redirects, link CRUD, attribution join | Cloudflare Workers + Hono |
| `packages/mcp-server` | Agent-facing tools (`create_link`, `get_stats`, `list_agent_runs`, …) | MCP server |
| `packages/sdk` | Typed JavaScript SDK over the REST API | TypeScript |
| `apps/extension` | Browser extension | Chrome/Firefox |
| `apps/video` | Marketing video assets | Remotion |
| `packages/db` | Schema, migrations, queries | Drizzle ORM + D1 adapter |
| `packages/auth` | Authentication | Better Auth (OAuth + magic-link + OTP) |
| `packages/payments` | Billing | Stripe adapter |
| `packages/analytics` | Server-side analytics | PostHog + GA4 |
| `packages/email` | Transactional email | React Email |
| `packages/logger` | Observability | Axiom + Workers Logs |
| `packages/config` / `packages/ui` | Shared config; UI primitives | Shadcn/ui |

## Data model
Drizzle ORM over Cloudflare D1 (SQLite). Key entities: links (slug, destination, owner, `agentId`/`agentRunId`, flags), click events (streamed to Analytics Engine), users/accounts (Better Auth), domains, agent runs. {prompt: confirm exact entities/relationships — link to `packages/db` schema + migrations}

## External dependencies
| Service | Used for | Failure mode |
|---------|----------|--------------|
| Cloudflare (Workers, D1, KV, R2, Analytics Engine, Queues, Durable Objects) | Entire runtime + storage | Platform outage → degraded/unavailable |
| Google Safe Browsing v4 | Destination malware/phishing check on create/update + rescan | {prompt: confirm fail-open vs fail-closed} |
| Cloudflare URL Scanner v2 | Second-layer phishing classifier | Second layer; primary check still applies |
| Stripe | Billing | Checkout/billing degraded; redirects unaffected |
| PostHog / GA4 | Product + web analytics | Analytics loss only |
| Axiom | Log aggregation | Reduced observability |

## Key constraints & trade-offs
- **Optimised for:** redirect latency (KV edge cache, no cold starts) and abuse-resistance by default.
- **Gave up / accepted:** D1/SQLite scale ceilings vs a managed Postgres; tight coupling to the Cloudflare platform (in exchange for edge performance + cost). Disabled links return HTTP 410 (never auto-follow); every redirect carries `X-Robots-Tag: noindex`.
- {prompt: capture any ADRs under docs/tech/adr/ as decisions firm up}

---
**Owner:** Rakesh Roushan · **Last reviewed:** 2026-06-21 · **Review by:** 2026-09-21

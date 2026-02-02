# Go2 Architecture Overview

This document describes the technical architecture of Go2, the edge-native URL shortener.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │ Browser  │  │   API    │  │ Extension│  │  Mobile  │                    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                    │
└───────┼─────────────┼─────────────┼─────────────┼──────────────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE NETWORK                                   │
│                    (310+ locations globally)                                 │
│                             │                                                │
│  ┌──────────────────────────┼──────────────────────────────┐               │
│  │              CLOUDFLARE WORKERS                          │               │
│  │                          │                               │               │
│  │    ┌─────────────────────┼─────────────────────┐        │               │
│  │    │                     ▼                     │        │               │
│  │    │  ┌──────────────────────────────────┐    │        │               │
│  │    │  │         HONO.JS API              │    │        │               │
│  │    │  │  ┌────────────────────────────┐  │    │        │               │
│  │    │  │  │ Routes:                    │  │    │        │               │
│  │    │  │  │ - /v1/links (CRUD)         │  │    │        │               │
│  │    │  │  │ - /v1/stats (Analytics)    │  │    │        │               │
│  │    │  │  │ - /auth (Authentication)   │  │    │        │               │
│  │    │  │  │ - /:slug (Redirect)        │  │    │        │               │
│  │    │  │  └────────────────────────────┘  │    │        │               │
│  │    │  └──────────────────────────────────┘    │        │               │
│  │    │                     │                     │        │               │
│  │    └─────────────────────┼─────────────────────┘        │               │
│  │                          │                               │               │
│  └──────────────────────────┼───────────────────────────────┘               │
│                             │                                                │
│  ┌──────────────────────────┼───────────────────────────────────────────────┐
│  │                    DATA LAYER                                             │
│  │                          │                                                │
│  │    ┌─────────────┐   ┌───┴───────┐   ┌─────────────┐   ┌─────────────┐  │
│  │    │  Cloudflare │   │ Cloudflare│   │  Cloudflare │   │  Durable    │  │
│  │    │     KV      │   │    D1     │   │     R2      │   │  Objects    │  │
│  │    │  (Cache)    │   │ (Database)│   │  (Storage)  │   │ (Rate Limit)│  │
│  │    └─────────────┘   └───────────┘   └─────────────┘   └─────────────┘  │
│  │                                                                           │
│  └───────────────────────────────────────────────────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                         │
│                             │                                                │
│    ┌─────────────┐   ┌─────┴─────┐   ┌─────────────┐   ┌─────────────┐     │
│    │  Supabase   │   │  Stripe   │   │   Resend    │   │   Sentry    │     │
│    │   (Auth)    │   │(Payments) │   │  (Email)    │   │ (Monitoring)│     │
│    └─────────────┘   └───────────┘   └─────────────┘   └─────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Link Redirect Flow

The core operation - redirecting a short link to its destination:

```
┌──────────┐     ┌──────────────────┐     ┌──────────┐     ┌─────────────┐
│  User    │     │ Cloudflare Edge  │     │    KV    │     │     D1      │
│ Browser  │     │    (Worker)      │     │  Cache   │     │  Database   │
└────┬─────┘     └────────┬─────────┘     └────┬─────┘     └──────┬──────┘
     │                    │                    │                  │
     │ GET go2.gg/launch  │                    │                  │
     │───────────────────>│                    │                  │
     │                    │                    │                  │
     │                    │ GET link:launch    │                  │
     │                    │───────────────────>│                  │
     │                    │                    │                  │
     │                    │     Link data      │                  │
     │                    │<───────────────────│ (Cache HIT)      │
     │                    │                    │                  │
     │  302 Redirect      │                    │                  │
     │<───────────────────│                    │                  │
     │                    │                    │                  │
     │                    │ Track click (async)│                  │
     │                    │───────────────────────────────────────>
     │                    │                    │                  │
```

**Performance**: ~10ms total (edge-to-edge, no origin server round-trip)

## Link Creation Flow

```
┌──────────┐     ┌──────────────────┐     ┌──────────┐     ┌─────────────┐
│Dashboard │     │    API Worker    │     │    D1    │     │     KV      │
│  (Next)  │     │     (Hono)       │     │ Database │     │   Cache     │
└────┬─────┘     └────────┬─────────┘     └────┬─────┘     └──────┬──────┘
     │                    │                    │                  │
     │ POST /v1/links     │                    │                  │
     │───────────────────>│                    │                  │
     │                    │                    │                  │
     │                    │ Validate & Create  │                  │
     │                    │───────────────────>│                  │
     │                    │                    │                  │
     │                    │     Link ID        │                  │
     │                    │<───────────────────│                  │
     │                    │                    │                  │
     │                    │ Cache link         │                  │
     │                    │───────────────────────────────────────>
     │                    │                    │                  │
     │  Created (201)     │                    │                  │
     │<───────────────────│                    │                  │
```

## Data Models

### Links Table

```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  user_id TEXT NOT NULL,
  domain_id TEXT,
  title TEXT,
  description TEXT,
  tags TEXT,
  password TEXT,
  expires_at INTEGER,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Framework** | Hono.js | Lightweight, TypeScript-first, designed for edge |
| **Database** | Cloudflare D1 | SQLite at the edge, low latency, zero config |
| **Cache** | Cloudflare KV | Edge-replicated, sub-ms reads globally |
| **Auth** | Supabase Auth | OAuth + magic links, good DX, generous free tier |
| **Payments** | Stripe | Industry standard, great API, handles complexity |
| **Web Framework** | Next.js 14 | App Router, Server Components, great DX |
| **Monorepo** | Turborepo | Fast builds, good caching, pnpm workspace support |
| **Rate Limiting** | Durable Objects | Distributed state, per-user limits |

## Performance Characteristics

| Metric | Target | How We Achieve It |
|--------|--------|-------------------|
| **Redirect Latency** | <10ms | KV cache, no origin round-trip |
| **API Latency** | <50ms | Edge workers, D1 |
| **Uptime** | 99.9% | Cloudflare's global network |
| **Cold Start** | <1ms | Workers runtime design |
| **Cache Hit Rate** | >95% | Aggressive KV caching |

## Security

- **Authentication**: JWT tokens via Supabase
- **Authorization**: Row-level security on links
- **Rate Limiting**: Durable Objects for distributed limiting
- **DDoS Protection**: Cloudflare WAF
- **Bot Protection**: Cloudflare Turnstile
- **HTTPS**: Automatic SSL on all domains

## Scaling Considerations

The architecture is designed to scale automatically:

1. **Workers**: Auto-scale to any load (no provisioning)
2. **KV**: Global replication handles read scale
3. **D1**: SQLite limits apply (~10GB per database)
4. **Rate Limiting**: Durable Objects provide consistent limits across regions

For enterprise scale (>10M links), consider:
- Sharding D1 databases
- Custom analytics pipeline (ClickHouse)
- Dedicated enterprise Workers

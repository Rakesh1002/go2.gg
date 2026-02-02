# Self-Hosting Go2

This guide covers everything you need to deploy Go2 on your own infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Deploy](#quick-deploy)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Custom Domains](#custom-domains)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Upgrades](#upgrades)
- [Troubleshooting](#troubleshooting)

## Overview

Go2 is designed to run on Cloudflare's edge network, providing sub-10ms redirects globally. The self-hosted version has full feature parity with Go2 Cloud.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Network                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Worker    │  │     D1      │  │     KV      │          │
│  │   (API)     │  │  (Database) │  │   (Cache)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js (Vercel/CF Pages)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### What You'll Need

| Service | Purpose | Required |
|---------|---------|----------|
| **Cloudflare** | Workers, D1, KV | ✅ Yes |
| **Vercel** or **Cloudflare Pages** | Web app hosting | ✅ Yes |
| **Stripe** | Payments (if billing enabled) | Optional |
| **Resend** | Transactional emails | Optional |

## Prerequisites

### Accounts Required

1. **Cloudflare Account** (Free tier works for small deployments)
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Workers: 100k requests/day free
   - D1: 5GB storage free
   - KV: 100k reads/day free

2. **Vercel Account** (Free tier works) OR Cloudflare Pages
   - Sign up at [vercel.com](https://vercel.com)

3. **Stripe Account** (Optional - for payments)
   - Sign up at [stripe.com](https://stripe.com)

4. **Resend Account** (Optional - for emails)
   - Sign up at [resend.com](https://resend.com)

### Development Tools

```bash
# Node.js 20+
node --version  # v20.0.0 or higher

# pnpm 9+
pnpm --version  # 9.0.0 or higher

# Wrangler CLI (Cloudflare)
npm install -g wrangler
wrangler --version

# Git
git --version
```

## Quick Deploy

### One-Click Deploy (Recommended)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Rakesh1002/go2.gg)

This will:
1. Fork the repository to your GitHub
2. Create Cloudflare D1 database
3. Create Cloudflare KV namespace
4. Deploy the API to Workers
5. Guide you through environment setup

### Deploy Web App

After deploying the API, deploy the web app:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rakesh1002/go2.gg/tree/main/app/apps/web)

## Manual Setup

### 1. Clone Repository

```bash
git clone https://github.com/Rakesh1002/go2.gg.git
cd go2.gg/app
pnpm install
```

### 2. Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create go2-db

# Create KV namespaces
wrangler kv:namespace create "LINKS_CACHE"
wrangler kv:namespace create "LINKS_CACHE" --preview
```

### 3. Update Configuration

Copy the IDs from the previous step into `apps/api/wrangler.toml`:

```toml
name = "go2-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "go2-db"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "LINKS_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_NAMESPACE_ID"
```

### 4. Set Environment Variables

```bash
# API secrets (use wrangler for production)
wrangler secret put DATABASE_URL
wrangler secret put AUTH_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
```

### 5. Run Database Migrations

```bash
# Development
pnpm db:migrate:dev

# Production
wrangler d1 migrations apply go2-db --remote
```

### 6. Deploy API

```bash
cd apps/api
pnpm run deploy
```

### 7. Deploy Web App

#### Option A: Vercel

```bash
cd apps/web
vercel
```

#### Option B: Cloudflare Pages

```bash
cd apps/web
pnpm run build
wrangler pages deploy .next
```

## Configuration

### Environment Variables

Create a `.env.local` file based on `env.example`:

```bash
# Required
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
AUTH_SECRET=your-auth-secret-min-32-chars

# Database
DATABASE_URL=your-d1-connection-string

# Optional: Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-domain.com

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Custom Branding

Edit `packages/config/src/brand.ts`:

```typescript
export const brand = {
  name: 'Your Brand',
  logo: '/your-logo.svg',
  primaryColor: '#6366f1',
  // ... more customization
}
```

### Pricing Configuration

Edit `packages/config/src/pricing.ts` to customize plans:

```typescript
export const plans = {
  free: {
    linksPerMonth: 100,
    trackedClicksPerMonth: 5000,
    domains: 1,
  },
  pro: {
    price: 19,
    linksPerMonth: 5000,
    // ...
  }
}
```

## Custom Domains

### For Short Links

1. Add your domain to Cloudflare
2. Create a CNAME record pointing to your Workers subdomain
3. Configure the domain in the dashboard

### For Web App

1. Add domain in Vercel/Cloudflare Pages
2. Update DNS records as instructed
3. SSL is automatic

### Wildcard Subdomains

For user-specific subdomains (e.g., `username.go2.gg`):

```bash
# Add wildcard DNS
*.your-domain.com → your-worker.workers.dev

# Enable wildcard in wrangler.toml
routes = [
  { pattern = "*.your-domain.com/*", zone_name = "your-domain.com" }
]
```

## Scaling

### Cloudflare Workers Limits

| Tier | Requests | CPU Time | Notes |
|------|----------|----------|-------|
| Free | 100k/day | 10ms | Good for testing |
| Paid ($5/mo) | 10M/month | 50ms | Production ready |
| Enterprise | Unlimited | Custom | Contact Cloudflare |

### Database Scaling

D1 is designed for read-heavy workloads:

- **Reads**: Near-instant from edge
- **Writes**: Propagate globally in ~60 seconds
- **Size**: 10GB per database (contact Cloudflare for more)

For high-write scenarios, consider:
- Using KV for caching
- Implementing write batching
- Durable Objects for consistency

### High Availability

Go2 on Cloudflare is inherently highly available:

- 310+ edge locations
- Automatic failover
- No single point of failure
- 99.99% uptime SLA (Enterprise)

## Monitoring

### Built-in Analytics

Go2 includes analytics for:
- Request counts and latency
- Error rates
- Top links and referrers

### Cloudflare Dashboard

Monitor Workers at [dash.cloudflare.com](https://dash.cloudflare.com):

- Request metrics
- Error rates
- CPU time
- Memory usage

### External Monitoring

Integrate with your preferred monitoring:

```typescript
// Example: Add custom metrics
import { trace } from '@opentelemetry/api'

export async function trackRedirect(linkId: string) {
  const span = trace.getSpan(trace.getActiveSpan())
  span?.setAttribute('link.id', linkId)
}
```

## Upgrades

### Staying Updated

```bash
# Add upstream remote
git remote add upstream https://github.com/Rakesh1002/go2.gg.git

# Fetch updates
git fetch upstream

# Merge updates
git merge upstream/main

# Resolve conflicts if any
# ...

# Deploy
pnpm run deploy
```

### Database Migrations

New versions may include migrations:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
wrangler d1 migrations apply go2-db --remote
```

### Breaking Changes

Check [CHANGELOG.md](CHANGELOG.md) before upgrading. Breaking changes are documented with migration guides.

## Troubleshooting

### Common Issues

#### Workers not responding

```bash
# Check deployment status
wrangler tail

# Verify configuration
wrangler whoami
```

#### Database errors

```bash
# Check D1 status
wrangler d1 info go2-db

# Run migrations again
wrangler d1 migrations apply go2-db --remote
```

#### KV cache issues

```bash
# List keys (debugging)
wrangler kv:key list --binding=LINKS_CACHE

# Delete specific key
wrangler kv:key delete --binding=LINKS_CACHE "key-name"
```

### Getting Help

- **Documentation**: [go2.gg/docs](https://go2.gg/docs)
- **GitHub Issues**: [Report bugs](https://github.com/Rakesh1002/go2.gg/issues)
- **GitHub Discussions**: [Community support](https://github.com/Rakesh1002/go2.gg/discussions)
- **Enterprise**: [enterprise@go2.gg](mailto:enterprise@go2.gg)

## Security Considerations

### Secrets Management

- Never commit secrets to git
- Use `wrangler secret` for production secrets
- Rotate secrets regularly
- Use different secrets for staging/production

### Access Control

- Enable Cloudflare Access for admin routes
- Implement rate limiting (built-in)
- Use strong authentication

### Compliance

For SOC 2, HIPAA, or GDPR compliance:

- Enable Cloudflare's compliance features
- Configure data residency
- Implement audit logging
- [Contact us](mailto:enterprise@go2.gg) for compliance guides

## Support

| Channel | Response Time | Best For |
|---------|---------------|----------|
| GitHub Issues | 24-48 hours | Bug reports, features |
| Discord | Community-based | Quick questions |
| Email | 24 hours | Private issues |
| Enterprise Support | 4 hours SLA | Critical issues |

---

**Need help?** [Open an issue](https://github.com/Rakesh1002/go2.gg/issues) or join the [discussions](https://github.com/Rakesh1002/go2.gg/discussions).

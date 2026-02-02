# Environment Setup

This document describes all environment variables required to run Go2.

## Overview

Go2 uses different environment files for different contexts:

| File | Usage |
|------|-------|
| `.env.local` | Local development (not committed) |
| `.env.example` | Template with all variables |
| Cloudflare Secrets | Production API secrets |
| Cloudflare Workers Vars | Production web runtime vars |
| GitHub Actions Variables | Build-time env vars (NEXT_PUBLIC_*) |

## Required Variables

### Core Configuration

```env
# Environment
NODE_ENV=development|production

# URLs
NEXT_PUBLIC_APP_URL=https://go2.gg
NEXT_PUBLIC_API_URL=https://api.go2.gg

# Default domain for short links
DEFAULT_DOMAIN=go2.gg
```

### Authentication (Supabase)

```env
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

**Setup**:
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy URL and keys

### Cloudflare

```env
# Account credentials
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# D1 Database
CLOUDFLARE_D1_DATABASE_ID=your-d1-id
CLOUDFLARE_D1_DATABASE_NAME=go2-db

# KV Namespaces
CLOUDFLARE_KV_LINKS_ID=your-kv-links-id
CLOUDFLARE_KV_CONFIG_ID=your-kv-config-id

# R2 Bucket
CLOUDFLARE_R2_BUCKET_NAME=go2-assets
```

**Setup**:
1. Get Account ID from Cloudflare Dashboard URL
2. Create API token: My Profile > API Tokens
3. Permissions needed: Workers, D1, KV, R2

### Payments (Stripe)

```env
# Keys
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_ANNUAL=price_xxx
```

**Setup**:
1. Create account at [stripe.com](https://stripe.com)
2. Get keys from Developers > API keys
3. Create products and prices in dashboard
4. Set up webhook endpoint: `https://api.go2.gg/webhooks/stripe`

### Email (Resend)

```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=Go2 <noreply@go2.gg>
```

**Setup**:
1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Create API key

### Security

```env
# CSRF protection (generate random 32+ char string)
CSRF_SECRET=generate-a-32-character-random-string-here

# Cloudflare Turnstile (bot protection)
TURNSTILE_SECRET_KEY=0x...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...

# Admin access
ADMIN_API_KEY=your-secure-admin-key
ADMIN_EMAILS=admin@go2.gg
```

### Monitoring (Optional)

```env
# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Feature Flags

```env
FEATURE_MAINTENANCE_MODE=false
FEATURE_ENABLE_SIGNUP=true
FEATURE_ENABLE_OAUTH_GOOGLE=true
FEATURE_ENABLE_OAUTH_GITHUB=true
FEATURE_ENABLE_MAGIC_LINK=true
FEATURE_ENABLE_SUBSCRIPTIONS=true
FEATURE_ENABLE_AI_FEATURES=false
FEATURE_WAITLIST_MODE=false
```

## Setting Up Locally

1. Copy the example file:
   ```bash
   cd app
   cp env.example .env.local
   ```

2. Fill in required values (start with Supabase, Cloudflare)

3. Start development servers:
   ```bash
   pnpm dev
   ```

## Setting Up for Production

### Cloudflare Workers (API)

Use `wrangler secret put` for each secret:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
# ... etc
```

### Cloudflare Workers (Web)

Build-time `NEXT_PUBLIC_*` variables are set via GitHub Actions variables (not secrets).
Runtime variables are configured in `wrangler.toml` under `[env.production.vars]`.

### GitHub Actions

**Add to repository secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

**Add to repository variables (for build-time NEXT_PUBLIC_* vars):**
- `NEXT_PUBLIC_APP_URL` = `https://go2.gg`
- `NEXT_PUBLIC_API_URL` = `https://api.go2.gg`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_DESCRIPTION`

## Variable Naming Conventions

| Prefix | Meaning |
|--------|---------|
| `NEXT_PUBLIC_` | Exposed to browser (client-side) |
| `STRIPE_` | Stripe-related |
| `CLOUDFLARE_` | Cloudflare infrastructure |
| `FEATURE_` | Feature flags |
| `ADMIN_` | Admin functionality |

## Security Notes

- Never commit `.env` or `.env.local` files
- Rotate secrets periodically
- Use different keys for development and production
- Limit API token permissions to minimum required
- Review access when team members leave

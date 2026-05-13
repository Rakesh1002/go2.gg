# Cloudflare Infrastructure

This directory contains Cloudflare-specific configuration and setup instructions.

## Resources Required

### D1 Database

```bash
# Create the database
wrangler d1 create shipquest-db

# Apply migrations (local)
wrangler d1 execute shipquest-db --file=../../packages/db/drizzle/0000_initial.sql --local

# Apply migrations (remote)
wrangler d1 execute shipquest-db --file=../../packages/db/drizzle/0000_initial.sql
```

### KV Namespace

```bash
# Create KV namespace for config/cache
wrangler kv:namespace create CONFIG

# Create KV namespace for Next.js cache (for OpenNext)
wrangler kv:namespace create NEXT_CACHE
```

### R2 Bucket

```bash
# Create R2 bucket for file storage
wrangler r2 bucket create shipquest-bucket
```

### Queues

```bash
# Create background job queue
wrangler queues create shipquest-background-queue
```

## Secrets Management

Set secrets via wrangler (don't commit these!):

```bash
# API secrets
cd apps/api

wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put SENTRY_DSN
wrangler secret put POSTHOG_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put CSRF_SECRET

# Production
wrangler secret put SUPABASE_URL --env production
# ... etc
```

## Deployment

### API

```bash
cd apps/api

# Deploy to development (default)
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

### Web (OpenNext)

```bash
cd apps/web

# Build for Cloudflare
pnpm build:cf

# Deploy
wrangler deploy
```

## Local Development

```bash
# API with local D1/KV/R2
cd apps/api
wrangler dev

# Web
cd apps/web
pnpm dev
```

## Custom Domains

Configure custom domains in the Cloudflare dashboard or via wrangler:

```bash
# Add custom domain to worker
wrangler domains add api.yourdomain.com
```

## Monitoring

- **Logs**: Available in Cloudflare dashboard under Workers > Logs
- **Analytics**: Workers Analytics in Cloudflare dashboard
- **Errors**: Sentry (if configured)

## Cost Optimization

- Workers: First 100k requests/day free
- D1: First 5M reads/day and 100k writes/day free
- KV: First 100k reads/day and 1k writes/day free
- R2: First 10GB storage and 1M Class A ops/month free
- Queues: First 1M operations/month free

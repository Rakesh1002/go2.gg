# Cloudflare Deployment Guide

This guide covers deploying Go2's API to Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Access to Cloudflare API token

## Initial Setup

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

### 2. Create D1 Database

```bash
cd app/apps/api

# Create production database
wrangler d1 create go2-db

# Note the database ID output
```

Update `wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "go2-db"
database_id = "your-database-id"
```

### 3. Create KV Namespaces

```bash
# Links cache
wrangler kv:namespace create KV_LINKS
wrangler kv:namespace create KV_LINKS --preview

# Config cache
wrangler kv:namespace create KV_CONFIG
wrangler kv:namespace create KV_CONFIG --preview
```

Update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV_LINKS"
id = "your-kv-links-id"
preview_id = "your-kv-links-preview-id"

[[kv_namespaces]]
binding = "KV_CONFIG"
id = "your-kv-config-id"
preview_id = "your-kv-config-preview-id"
```

### 4. Create R2 Bucket (Optional)

```bash
wrangler r2 bucket create go2-assets
```

### 5. Run Migrations

```bash
# Apply migrations to production
wrangler d1 migrations apply go2-db --remote
```

## Environment Variables

Set secrets in Cloudflare:

```bash
# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Stripe
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Other
wrangler secret put CSRF_SECRET
wrangler secret put ADMIN_API_KEY
```

## Deployment

### Manual Deployment

```bash
cd app/apps/api
pnpm run deploy
```

### GitHub Actions (Automated)

The `.github/workflows/deploy-api.yml` workflow handles deployment on push to `main`.

Required GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Custom Domain Setup

### 1. Add Domain to Cloudflare

Transfer or add your domain to Cloudflare DNS.

### 2. Create Worker Route

In Cloudflare Dashboard:
1. Go to Workers & Pages > your worker
2. Settings > Triggers > Add Route
3. Add route: `api.go2.gg/*` → go2-api

Or via wrangler.toml:

```toml
routes = [
  { pattern = "api.go2.gg/*", zone_name = "go2.gg" }
]
```

### 3. SSL Certificate

Cloudflare automatically provisions SSL certificates for custom domains.

## Monitoring

### Logs

```bash
# Tail live logs
wrangler tail

# Filter by status
wrangler tail --status error
```

### Metrics

View in Cloudflare Dashboard:
- Workers & Pages > Analytics
- Request count, duration, errors
- CPU time usage

### Alerts

Set up alerts in Cloudflare Dashboard:
1. Notifications > Create
2. Choose: Workers > Error Rate Anomaly
3. Configure threshold and notification channels

## Troubleshooting

### Common Issues

**"No such database"**
- Verify database ID in wrangler.toml
- Check you're deploying to the correct account

**"KV namespace not found"**
- Ensure KV namespaces exist
- Verify IDs match wrangler.toml

**"Script too large"**
- Check bundle size (limit: 1MB)
- Review dependencies, consider tree-shaking

### Debug Mode

Enable verbose logging:

```bash
wrangler dev --log-level debug
```

## Rollback

If a deployment causes issues:

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

## Production Checklist

Before going live:

- [ ] All environment secrets set
- [ ] D1 migrations applied
- [ ] KV namespaces configured
- [ ] Custom domain routing set up
- [ ] SSL certificates active
- [ ] Rate limiting configured
- [ ] Monitoring alerts enabled
- [ ] Error tracking (Sentry) connected

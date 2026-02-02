# Go2 Web

Next.js web application for Go2, deployed on Cloudflare Workers via [OpenNext](https://opennext.js.org/).

## Getting Started

```bash
# From the monorepo root
pnpm dev:web

# Or from this directory
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Development

```bash
pnpm dev          # Start development server (Turbopack)
pnpm build        # Build for production
pnpm lint         # Run Biome linter
pnpm typecheck    # TypeScript type checking
```

## Deployment

### Manual Deployment

```bash
# Build Next.js, then build for Cloudflare Workers
pnpm deploy

# Or step by step:
pnpm build        # Build Next.js
pnpm build:cf     # Build for Cloudflare Workers (OpenNext)
wrangler deploy --env production
```

### Automated Deployment

Push to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy-web.yml`).

**Required GitHub Variables** (for build-time NEXT_PUBLIC_* vars):
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`

**Required GitHub Secrets**:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Configuration

Environment variables are configured in:
- `.env.local` - Local development
- `wrangler.toml` - Cloudflare Workers runtime vars
- GitHub Actions variables - Build-time vars (NEXT_PUBLIC_*)

See `wrangler.toml` for production configuration.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

# Getting Started

This guide will help you set up Go2 for local development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+**: [Download](https://nodejs.org/)
- **pnpm 9+**: Install with `npm install -g pnpm`
- **Git**: [Download](https://git-scm.com/)
- **Cloudflare Account**: [Sign up](https://cloudflare.com) (free)
- **Supabase Account**: [Sign up](https://supabase.com) (free)
- **Stripe Account**: [Sign up](https://stripe.com) (free for testing)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Rakesh1002/go2.gg.git
cd go2.gg
```

### 2. Install Dependencies

```bash
cd app
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials. At minimum, you need:

```env
# Supabase (for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 4. Set Up Cloudflare (for API)

```bash
# Login to Cloudflare
wrangler login

# Create local D1 database
cd apps/api
wrangler d1 create go2-db-dev --local
```

### 5. Run Database Migrations

```bash
cd app
pnpm db:migrate:dev
```

### 6. Start Development Servers

```bash
pnpm dev
```

This starts:
- **Web app**: http://localhost:3000
- **API**: http://localhost:8787

## Project Structure

```
go2.gg/
├── app/                      # Main application
│   ├── apps/
│   │   ├── api/              # Cloudflare Workers API
│   │   ├── web/              # Next.js web app
│   │   └── extension/        # Browser extension
│   ├── packages/             # Shared code
│   │   ├── auth/             # Authentication
│   │   ├── db/               # Database
│   │   ├── payments/         # Stripe
│   │   └── ...
│   └── content/              # Documentation content
├── docs/                     # Product/ops docs
└── resources/                # Brand assets
```

## Development Workflow

### Running Specific Apps

```bash
# Web only
pnpm dev:web

# API only
pnpm dev:api

# Both (default)
pnpm dev
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Database

```bash
# Create migration
cd app/packages/db
pnpm drizzle-kit generate:sqlite

# Apply migrations (dev)
cd app
pnpm db:migrate:dev

# Open Drizzle Studio
pnpm db:studio
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @repo/web build
```

## Common Tasks

### Create a New Link

1. Start dev servers: `pnpm dev`
2. Open http://localhost:3000
3. Sign up / Login
4. Click "Create Link"
5. Enter URL and optional slug

### Test Link Redirect

After creating a link with slug `test`:

```bash
curl -I http://localhost:8787/test
```

### Test API Directly

```bash
# Health check
curl http://localhost:8787/health

# Create link (authenticated)
curl -X POST http://localhost:8787/v1/links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://example.com"}'
```

### Debug Cloudflare Worker

```bash
cd app/apps/api
wrangler dev --local --persist
```

## Troubleshooting

### "Cannot find module '@repo/xxx'"

Packages need to be built:

```bash
pnpm build
```

### D1 Database Errors

Reset local database:

```bash
cd app/apps/api
rm -rf .wrangler/state
wrangler d1 execute go2-db-dev --local --file=../packages/db/drizzle/0000_initial.sql
```

### Port Already in Use

Kill the process or use different ports:

```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### TypeScript Errors After Pulling

Rebuild packages:

```bash
pnpm clean
pnpm install
pnpm build
```

## Editor Setup

### VS Code Extensions

Recommended extensions (`.vscode/extensions.json`):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Biome

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## Next Steps

- Read [Architecture Overview](../architecture/overview.md)
- Set up [Environment Variables](../deployment/environment.md)
- Review the [API routes](../../app/apps/api/src/routes/)
- Explore [UI components](../../app/apps/web/components/)

## Need Help?

- Check [GitHub Discussions](https://github.com/Rakesh1002/go2.gg/discussions)
- Review existing [Issues](https://github.com/Rakesh1002/go2.gg/issues)
- Read the [Contributing Guide](../../CONTRIBUTING.md)

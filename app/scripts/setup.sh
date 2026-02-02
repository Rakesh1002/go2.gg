#!/bin/bash

# =============================================================================
# ShipQuest Setup Script
# =============================================================================
# Run this script to set up the development environment
# Usage: ./scripts/setup.sh
# =============================================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║   🚀 ShipQuest - Ship Your SaaS in Days, Not Months               ║"
echo "║                                                                   ║"
echo "║   Production-Ready Next.js + Cloudflare Boilerplate               ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# Check prerequisites
# -----------------------------------------------------------------------------

echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ pnpm $(pnpm -v)"
echo ""

# -----------------------------------------------------------------------------
# Install dependencies
# -----------------------------------------------------------------------------

echo "📦 Installing dependencies..."
pnpm install
echo ""

# -----------------------------------------------------------------------------
# Copy environment files
# -----------------------------------------------------------------------------

echo "📝 Setting up environment files..."

if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "   Created .env.local from template"
else
    echo "   .env.local already exists, skipping"
fi

if [ ! -f apps/web/.env.local ]; then
    cp env.example apps/web/.env.local
    echo "   Created apps/web/.env.local"
else
    echo "   apps/web/.env.local already exists, skipping"
fi

if [ ! -f apps/api/.dev.vars ]; then
    cat > apps/api/.dev.vars << 'EOF'
# =============================================================================
# API Development Variables
# =============================================================================
# These are used by wrangler dev for local development
# Secrets should be set via: wrangler secret put <NAME>

APP_ENV=development
APP_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional
# SENTRY_DSN=
# POSTHOG_API_KEY=
# TURNSTILE_SECRET_KEY=
# CSRF_SECRET=generate-a-32-character-random-string
EOF
    echo "   Created apps/api/.dev.vars"
else
    echo "   apps/api/.dev.vars already exists, skipping"
fi

echo ""

# -----------------------------------------------------------------------------
# Build packages
# -----------------------------------------------------------------------------

echo "🔨 Building packages..."
pnpm build
echo ""

# -----------------------------------------------------------------------------
# Database setup info
# -----------------------------------------------------------------------------

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete!                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📌 NEXT STEPS:"
echo ""
echo "   1. 🔧 CONFIGURE YOUR PRODUCT"
echo "      Edit packages/config/src/site.ts with your branding"
echo "      Edit packages/config/src/pricing.ts with your plans"
echo ""
echo "   2. 🔐 SET UP ENVIRONMENT VARIABLES"
echo "      Edit .env.local with your credentials:"
echo "      - Supabase URL and keys"
echo "      - Stripe API keys and price IDs"
echo "      - (Optional) PostHog and Sentry"
echo ""
echo "   3. ☁️  SET UP CLOUDFLARE (optional for local dev)"
echo "      wrangler login"
echo "      wrangler d1 create shipquest-db"
echo "      wrangler kv:namespace create CONFIG"
echo ""
echo "   4. 💾 INITIALIZE DATABASE"
echo "      wrangler d1 execute shipquest-db --file=packages/db/drizzle/0000_initial.sql --local"
echo ""
echo "   5. 🚀 START DEVELOPMENT"
echo "      pnpm dev"
echo ""
echo "      Web: http://localhost:3000"
echo "      API: http://localhost:8787"
echo ""
echo "📚 DOCUMENTATION"
echo "   Full docs: http://localhost:3000/docs"
echo "   README: ./README.md"
echo ""
echo "Need help? Join Discord: https://discord.gg/shipquest"
echo ""

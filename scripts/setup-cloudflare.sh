#!/bin/bash

# =============================================================================
# Go2.gg - Cloudflare Infrastructure Setup Script
# =============================================================================
# This script helps you set up all required Cloudflare resources for Go2.
#
# Prerequisites:
#   - Node.js 18+ installed
#   - Wrangler CLI installed (npm i -g wrangler)
#   - Logged in to Wrangler (wrangler login)
#
# Usage:
#   ./scripts/setup-cloudflare.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "  ██████   ██████  ██████  "
echo " ██       ██  ████      ██ "
echo " ██   ███ ██ ██ ██  █████  "
echo " ██    ██ ████  ██ ██      "
echo "  ██████   ██████  ███████ "
echo -e "${NC}"
echo "Go2.gg - Cloudflare Setup Script"
echo "================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: Wrangler CLI is not installed.${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Wrangler authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Wrangler.${NC}"
    echo "Run: wrangler login"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"
echo ""

# Variables to store created resource IDs
D1_DATABASE_ID=""
KV_CONFIG_ID=""
KV_LINKS_ID=""

# =============================================================================
# Step 1: Create D1 Database
# =============================================================================
echo -e "${BLUE}Step 1: Creating D1 Database...${NC}"
echo ""

# Check if database already exists
if wrangler d1 list 2>/dev/null | grep -q "go2-db"; then
    echo -e "${YELLOW}Database 'go2-db' already exists. Fetching ID...${NC}"
    D1_DATABASE_ID=$(wrangler d1 list --json 2>/dev/null | jq -r '.[] | select(.name=="go2-db") | .uuid')
else
    echo "Creating new D1 database 'go2-db'..."
    CREATE_OUTPUT=$(wrangler d1 create go2-db 2>&1)
    D1_DATABASE_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "$CREATE_OUTPUT" | grep -oP 'uuid: \K[a-f0-9-]+')
fi

if [ -z "$D1_DATABASE_ID" ]; then
    echo -e "${RED}Failed to get D1 database ID. Please create manually:${NC}"
    echo "  wrangler d1 create go2-db"
    exit 1
fi

echo -e "${GREEN}✓ D1 Database ID: $D1_DATABASE_ID${NC}"
echo ""

# =============================================================================
# Step 2: Create KV Namespaces
# =============================================================================
echo -e "${BLUE}Step 2: Creating KV Namespaces...${NC}"
echo ""

# KV_CONFIG namespace
echo "Creating KV namespace 'go2-config'..."
if wrangler kv:namespace list 2>/dev/null | grep -q "go2-config"; then
    echo -e "${YELLOW}Namespace 'go2-config' already exists.${NC}"
    KV_CONFIG_ID=$(wrangler kv:namespace list --json 2>/dev/null | jq -r '.[] | select(.title | contains("go2-config")) | .id' | head -1)
else
    CREATE_OUTPUT=$(wrangler kv:namespace create go2-config 2>&1)
    KV_CONFIG_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'id = "\K[^"]+')
fi
echo -e "${GREEN}✓ KV_CONFIG ID: $KV_CONFIG_ID${NC}"

# LINKS_KV namespace
echo "Creating KV namespace 'go2-links'..."
if wrangler kv:namespace list 2>/dev/null | grep -q "go2-links"; then
    echo -e "${YELLOW}Namespace 'go2-links' already exists.${NC}"
    KV_LINKS_ID=$(wrangler kv:namespace list --json 2>/dev/null | jq -r '.[] | select(.title | contains("go2-links")) | .id' | head -1)
else
    CREATE_OUTPUT=$(wrangler kv:namespace create go2-links 2>&1)
    KV_LINKS_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'id = "\K[^"]+')
fi
echo -e "${GREEN}✓ LINKS_KV ID: $KV_LINKS_ID${NC}"
echo ""

# =============================================================================
# Step 3: Create R2 Bucket
# =============================================================================
echo -e "${BLUE}Step 3: Creating R2 Bucket...${NC}"
echo ""

if wrangler r2 bucket list 2>/dev/null | grep -q "go2-assets"; then
    echo -e "${YELLOW}R2 bucket 'go2-assets' already exists.${NC}"
else
    echo "Creating R2 bucket 'go2-assets'..."
    wrangler r2 bucket create go2-assets 2>/dev/null || true
fi
echo -e "${GREEN}✓ R2 Bucket: go2-assets${NC}"
echo ""

# =============================================================================
# Step 4: Run Database Migrations
# =============================================================================
echo -e "${BLUE}Step 4: Running Database Migrations...${NC}"
echo ""

MIGRATIONS_DIR="packages/db/drizzle"
if [ -d "$MIGRATIONS_DIR" ]; then
    for migration in $MIGRATIONS_DIR/*.sql; do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")
            echo "Applying migration: $filename"
            wrangler d1 execute go2-db --file="$migration" --remote 2>/dev/null || \
            wrangler d1 execute go2-db --file="$migration" 2>/dev/null || \
            echo -e "${YELLOW}Warning: Could not apply $filename (may already be applied)${NC}"
        fi
    done
    echo -e "${GREEN}✓ Migrations applied${NC}"
else
    echo -e "${YELLOW}No migrations directory found at $MIGRATIONS_DIR${NC}"
fi
echo ""

# =============================================================================
# Step 5: Seed Default Domain
# =============================================================================
echo -e "${BLUE}Step 5: Seeding Default Domain...${NC}"
echo ""

DOMAIN_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "00000000-0000-0000-0000-000000000001")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

SEED_SQL="INSERT INTO domains (id, organization_id, name, is_custom, is_verified, created_at, updated_at)
VALUES ('$DOMAIN_ID', NULL, 'go2.gg', 0, 1, '$NOW', '$NOW')
ON CONFLICT (name) DO NOTHING;"

echo "$SEED_SQL" | wrangler d1 execute go2-db --command="$SEED_SQL" --remote 2>/dev/null || \
echo "$SEED_SQL" | wrangler d1 execute go2-db --command="$SEED_SQL" 2>/dev/null || \
echo -e "${YELLOW}Note: Default domain may already exist${NC}"

echo -e "${GREEN}✓ Default domain 'go2.gg' seeded${NC}"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo "Created resources:"
echo "  • D1 Database ID:  $D1_DATABASE_ID"
echo "  • KV Config ID:    $KV_CONFIG_ID"
echo "  • KV Links ID:     $KV_LINKS_ID"
echo "  • R2 Bucket:       go2-assets"
echo "  • Analytics:       go2_clicks (created on first use)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Update apps/api/wrangler.toml with these IDs:"
echo ""
echo "   [[d1_databases]]"
echo "   binding = \"DB\""
echo "   database_name = \"go2-db\""
echo "   database_id = \"$D1_DATABASE_ID\""
echo ""
echo "   [[kv_namespaces]]"
echo "   binding = \"KV_CONFIG\""
echo "   id = \"$KV_CONFIG_ID\""
echo ""
echo "   [[kv_namespaces]]"
echo "   binding = \"LINKS_KV\""
echo "   id = \"$KV_LINKS_ID\""
echo ""
echo "2. Set secrets:"
echo "   wrangler secret put SUPABASE_URL"
echo "   wrangler secret put SUPABASE_ANON_KEY"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "   wrangler secret put STRIPE_SECRET_KEY"
echo "   wrangler secret put STRIPE_WEBHOOK_SECRET"
echo ""
echo "3. Deploy:"
echo "   cd apps/api && wrangler deploy"
echo ""
echo -e "${GREEN}Happy shortening! 🚀${NC}"

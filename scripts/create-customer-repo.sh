#!/bin/bash

# =============================================================================
# ShipQuest Customer Repository Generator
# =============================================================================
#
# This script creates a clean customer-ready boilerplate by:
# 1. Copying the full codebase
# 2. Removing ShipQuest marketing pages
# 3. Replacing ShipQuest branding with generic placeholders
# 4. Creating a customer-focused README
#
# Usage: ./scripts/create-customer-repo.sh [output-directory]
# Example: ./scripts/create-customer-repo.sh dist/customer-boilerplate
#
# The output is created within the project's dist/ folder by default.
# This folder is gitignored so the customer repo won't pollute the main repo.
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# Default output directory - inside the project's dist folder
OUTPUT_DIR="${1:-$SOURCE_DIR/dist/customer-boilerplate}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  ShipQuest Customer Repository Generator${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Source: ${YELLOW}$SOURCE_DIR${NC}"
echo -e "Output: ${YELLOW}$OUTPUT_DIR${NC}"
echo ""

# Confirm
read -p "This will create a customer-ready repository. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# Create output directory
echo -e "${GREEN}Creating output directory...${NC}"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy source files (excluding git, node_modules, etc)
echo -e "${GREEN}Copying source files...${NC}"
rsync -av --progress "$SOURCE_DIR/" "$OUTPUT_DIR/" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.turbo' \
    --exclude 'dist' \
    --exclude '.wrangler' \
    --exclude 'pnpm-lock.yaml' \
    --exclude '.env.local' \
    --exclude '.env' \
    --exclude '*.log'

# =============================================================================
# Remove ShipQuest-specific marketing pages
# =============================================================================
echo -e "${GREEN}Removing ShipQuest-specific files...${NC}"

# Remove boilerplate purchase flow (customers don't need this)
rm -rf "$OUTPUT_DIR/apps/web/app/(marketing)/buy"
rm -rf "$OUTPUT_DIR/apps/web/app/purchase"
rm -rf "$OUTPUT_DIR/apps/web/app/api/purchase"
rm -rf "$OUTPUT_DIR/apps/web/app/api/webhooks/stripe-purchase"

# Remove competitor comparison (ShipQuest marketing)
rm -f "$OUTPUT_DIR/apps/web/components/marketing/sections/competitor-comparison.tsx"

# =============================================================================
# Create generic site configuration
# =============================================================================
echo -e "${GREEN}Creating generic site configuration...${NC}"

cat > "$OUTPUT_DIR/packages/config/src/site.ts" << 'EOF'
/**
 * Site Configuration
 *
 * Central configuration for site metadata, branding, and links.
 * Update these values with your product's branding.
 */

export interface SiteConfig {
  /** Site name displayed in header and metadata */
  name: string;
  /** Short tagline for the site */
  tagline: string;
  /** Full description for SEO */
  description: string;
  /** Production URL (used for sitemap, OG images) */
  url: string;
  /** Default OG image path */
  ogImage: string;
  /** Company/creator name */
  creator: string;
  /** Contact email */
  email: string;
  /** Social links */
  links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
  };
  /** Theme configuration */
  theme: {
    /** Primary brand color (hex) */
    primaryColor: string;
    /** Default theme mode */
    defaultMode: "light" | "dark" | "system";
  };
  /** Analytics IDs */
  analytics: {
    googleAnalyticsId?: string;
    posthogKey?: string;
  };
}

export const siteConfig: SiteConfig = {
  // ============================================
  // UPDATE THESE VALUES FOR YOUR PRODUCT
  // ============================================
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Your SaaS",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Build something amazing",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Your product description here. Explain what makes your SaaS unique and valuable.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com",
  ogImage: "/og.png",
  creator: process.env.NEXT_PUBLIC_CREATOR_NAME ?? "Your Company",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@yourdomain.com",
  links: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
    github: process.env.NEXT_PUBLIC_GITHUB_URL,
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    discord: process.env.NEXT_PUBLIC_DISCORD_URL,
  },
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#6366f1",
    defaultMode:
      (process.env.NEXT_PUBLIC_DEFAULT_THEME as "light" | "dark" | "system") ??
      "system",
  },
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
};

/**
 * Get the full URL for a path
 */
export function getUrl(path: string = ""): string {
  return `${siteConfig.url}${path}`;
}

/**
 * Get metadata for a page
 */
export function getMetadata(options: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}) {
  const title = options.title
    ? `${options.title} | ${siteConfig.name}`
    : `${siteConfig.name} - ${siteConfig.tagline}`;

  return {
    title,
    description: options.description ?? siteConfig.description,
    openGraph: {
      title,
      description: options.description ?? siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: options.image ?? siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: options.description ?? siteConfig.description,
      images: [options.image ?? siteConfig.ogImage],
      creator: siteConfig.links.twitter,
    },
    robots: options.noIndex ? { index: false, follow: false } : undefined,
  };
}
EOF

# =============================================================================
# Create customer README
# =============================================================================
echo -e "${GREEN}Creating customer README...${NC}"

cat > "$OUTPUT_DIR/README.md" << 'EOF'
# Your SaaS Name

Welcome to your new SaaS project! This boilerplate includes everything you need to launch fast.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env.local
cp env.example apps/web/.env.local
cp env.example apps/api/.env

# Start development servers
pnpm dev

# Open in browser
# Web: http://localhost:3000
# API: http://localhost:8787
```

## Configuration

### 1. Branding (First Step!)

Update your product's branding in `packages/config/src/site.ts`:

```typescript
export const siteConfig = {
  name: "Your Product Name",
  tagline: "Your catchy tagline",
  description: "What your product does",
  url: "https://yourdomain.com",
  email: "hello@yourdomain.com",
  // ...
};
```

### 2. Environment Variables

Copy `env.example` and fill in your credentials:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

**Optional:**
- `POSTHOG_API_KEY` - PostHog analytics
- `SENTRY_DSN` - Sentry error tracking
- `TURNSTILE_SECRET_KEY` - Cloudflare bot protection

### 3. Pricing Plans

Configure your pricing in `packages/config/src/pricing.ts`:

```typescript
export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    // ...
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    stripePriceIdMonthly: "price_xxx", // From Stripe Dashboard
    // ...
  },
];
```

### 4. Database

Run migrations to set up your database:

```bash
pnpm db:migrate
```

## Project Structure

```
├── apps/
│   ├── web/                  # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, register, forgot password
│   │   │   ├── (dashboard)/  # Protected user dashboard
│   │   │   ├── (marketing)/  # Landing page, pricing, features
│   │   │   └── (legal)/      # Terms, privacy, cookies
│   │   └── components/       # React components
│   └── api/                  # Hono API (Cloudflare Workers)
├── packages/
│   ├── config/               # Site, pricing, features config
│   ├── auth/                 # Authentication & RBAC
│   ├── db/                   # Database (Drizzle ORM)
│   ├── payments/             # Stripe integration
│   ├── email/                # Email templates
│   └── ui/                   # Shared UI components
└── content/
    ├── blog/                 # MDX blog posts
    └── docs/                 # MDX documentation
```

## Features Included

### Authentication
- Email/password login
- Magic link (passwordless)
- OAuth (Google, GitHub)
- Session management
- Role-based access control

### Payments
- Stripe Checkout
- Subscription management
- Customer billing portal
- Webhook handling

### Multi-Tenancy
- Organizations & teams
- Team invitations
- Role-based permissions
- Organization switching

### AI Features
- Multi-provider routing (OpenAI, Anthropic, Google)
- RAG/Answer engine
- AI agents with tools
- Streaming chat interface

### Marketing
- Landing page sections
- Pricing page
- Blog (MDX)
- Documentation (MDX)
- SEO optimization

## Deployment

### Cloudflare Workers (Recommended)

```bash
# Deploy API
cd apps/api
wrangler deploy --env production

# Deploy Web
cd apps/web
pnpm build:cf
wrangler deploy --env production
```

### Vercel

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

## Need Help?

- Check the documentation in `/docs`
- Review code comments and types
- Customize freely - you own this code!

---

Built with the ShipQuest boilerplate. Ship faster. Build better.
EOF

# =============================================================================
# Update marketing landing page to be generic
# =============================================================================
echo -e "${GREEN}Creating generic landing page...${NC}"

cat > "$OUTPUT_DIR/apps/web/app/(marketing)/page.tsx" << 'EOF'
import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, siteConfig, pricingPlans, featuresConfig, features, testimonials, faqItems } from "@repo/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  ArrowRight,
  Shield,
  Globe,
  Rocket,
  Clock,
  Star,
} from "lucide-react";
import { TechStackSection } from "@/components/marketing/sections/tech-stack";
import { TestimonialsCarousel } from "@/components/marketing/sections/testimonials-carousel";

export const metadata: Metadata = getMetadata({
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
});

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Focus on building your product, not infrastructure.",
  },
  {
    icon: Rocket,
    title: "Launch Faster",
    description: "Go from idea to production in days, not months.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security built into every layer.",
  },
  {
    icon: Globe,
    title: "Scale Globally",
    description: "Deploy worldwide with edge performance.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {siteConfig.tagline.split(' ').slice(0, -2).join(' ')}
              <span className="block text-primary">
                {siteConfig.tagline.split(' ').slice(-2).join(' ')}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {siteConfig.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-14 gap-2 px-8 text-lg">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-14 gap-2 px-8 text-lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-y bg-muted/30">
        <div className="container px-4 py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {featuresConfig.headline}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {featuresConfig.subheadline}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 6).map((feature) => (
            <div
              key={feature.id}
              className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/features">
            <Button variant="outline">
              View All Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Tech Stack */}
      <TechStackSection />

      {/* Testimonials */}
      {testimonials.length > 0 && <TestimonialsCarousel />}

      {/* Pricing Preview */}
      <section className="container px-4 py-16 md:py-24" id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that works best for you. Start free, upgrade when you need more.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {pricingPlans.slice(0, 3).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border bg-card p-6 ${
                plan.recommended ? "border-primary shadow-lg" : ""
              }`}
            >
              <h3 className="font-bold text-xl">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${plan.priceMonthly ?? "Custom"}
                </span>
                {plan.priceMonthly !== null && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
              <Link href={plan.ctaLink ?? "/register"}>
                <Button
                  className="mt-6 w-full"
                  variant={plan.recommended ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/pricing">
            <Button variant="link">
              View Full Pricing Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t bg-muted/30">
        <div className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Common Questions
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.slice(0, 5).map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Join thousands of happy customers. Start your free trial today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-14 gap-2 px-8 text-lg">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="h-14 gap-2 border-primary-foreground/20 px-8 text-lg text-primary-foreground hover:bg-primary-foreground/10"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
EOF

# =============================================================================
# Remove boilerplate.ts (customers don't need it)
# =============================================================================
echo -e "${GREEN}Cleaning up boilerplate-specific config...${NC}"

# Keep a minimal version for reference
cat > "$OUTPUT_DIR/packages/config/src/boilerplate.ts" << 'EOF'
/**
 * Boilerplate Configuration
 *
 * This file was used for the ShipQuest marketing site.
 * You can delete this file or repurpose it for your own
 * boilerplate/template selling needs.
 *
 * The actual product configuration you need is in:
 * - site.ts (branding)
 * - pricing.ts (plans)
 * - features.ts (feature flags)
 * - product-features.ts (marketing features)
 */

export const boilerplateConfig = {
  productName: "Your Product",
  version: "1.0.0",
};

export const boilerplateLicenses: never[] = [];
export const boilerplateFeatures: never[] = [];
export const boilerplateFAQ: never[] = [];
export const boilerplateIncludes = { categories: [] };
export const socialProof = {};
export const valuePropositions: never[] = [];

export function getLicense() {
  return undefined;
}

export type BoilerplateConfig = typeof boilerplateConfig;
export type BoilerplateLicense = never;
EOF

# =============================================================================
# Initialize git repo
# =============================================================================
echo -e "${GREEN}Initializing git repository...${NC}"

cd "$OUTPUT_DIR"
git init
git add .
git commit -m "Initial commit from ShipQuest boilerplate"

# =============================================================================
# Done!
# =============================================================================
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Customer repository created successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Location: ${YELLOW}$OUTPUT_DIR${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $OUTPUT_DIR"
echo "  2. pnpm install"
echo "  3. Update packages/config/src/site.ts with your branding"
echo "  4. Copy env.example to .env.local and add your credentials"
echo "  5. pnpm dev"
echo ""
echo -e "${GREEN}Happy shipping! 🚀${NC}"

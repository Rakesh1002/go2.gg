#!/usr/bin/env npx tsx

/**
 * Go2 Database Seed Script
 *
 * Seeds the database with initial data for development.
 *
 * Usage:
 *   pnpm seed              # Show seed SQL
 *   pnpm seed --sql        # Output SQL only (for piping)
 *   wrangler d1 execute go2-db --file=./seed.sql  # Seed D1
 */

import { randomUUID } from "node:crypto";

// Get current timestamp
const now = new Date().toISOString();

// =============================================================================
// Seed Data
// =============================================================================

// Default domain - go2.gg (system domain, no organization)
const defaultDomain = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "go2.gg",
  isCustom: false,
  isVerified: true,
};

// Sample users for development
const users = [
  {
    id: randomUUID(),
    email: "admin@go2.gg",
    name: "Admin User",
    emailVerified: true,
  },
  {
    id: randomUUID(),
    email: "demo@go2.gg",
    name: "Demo User",
    emailVerified: true,
  },
];

// Sample organizations
const organizations = [
  {
    id: randomUUID(),
    name: "Go2 Team",
    slug: "go2-team",
    plan: "business",
    ownerId: users[0]?.id,
  },
  {
    id: randomUUID(),
    name: "Demo Org",
    slug: "demo",
    plan: "free",
    ownerId: users[1]?.id,
  },
];

// Custom domains for organizations
const customDomains = [
  {
    id: randomUUID(),
    organizationId: organizations[0]?.id,
    name: "short.go2.gg",
    isCustom: true,
    isVerified: true,
  },
];

// Sample links
const sampleLinks = [
  {
    id: randomUUID(),
    organizationId: organizations[0]?.id,
    userId: users[0]?.id,
    domain: "go2.gg",
    slug: "github",
    destinationUrl: "https://github.com/Rakesh1002/go2.gg",
    title: "Go2 GitHub Repository",
    clickCount: 0,
  },
  {
    id: randomUUID(),
    organizationId: organizations[0]?.id,
    userId: users[0]?.id,
    domain: "go2.gg",
    slug: "docs",
    destinationUrl: "https://go2.gg/docs",
    title: "Go2 Documentation",
    clickCount: 0,
  },
];

// =============================================================================
// SQL Generation
// =============================================================================

function generateSeedSQL(): string {
  const statements: string[] = [];

  // Header
  statements.push("-- Go2 Database Seed");
  statements.push(`-- Generated: ${now}`);
  statements.push("");

  // Default domain (system-level, no organization)
  statements.push("-- Default Domain");
  statements.push(
    `
INSERT INTO domains (id, organization_id, name, is_custom, is_verified, created_at, updated_at)
VALUES (
  '${defaultDomain.id}',
  NULL,
  '${defaultDomain.name}',
  ${defaultDomain.isCustom ? 1 : 0},
  ${defaultDomain.isVerified ? 1 : 0},
  '${now}',
  '${now}'
)
ON CONFLICT (name) DO NOTHING;
  `.trim()
  );

  statements.push("");
  statements.push("-- Users");

  // Insert users
  for (const user of users) {
    statements.push(
      `
INSERT INTO users (id, email, name, email_verified, created_at, updated_at)
VALUES (
  '${user.id}',
  '${user.email}',
  '${user.name}',
  ${user.emailVerified ? 1 : 0},
  '${now}',
  '${now}'
)
ON CONFLICT (id) DO NOTHING;
    `.trim()
    );
  }

  statements.push("");
  statements.push("-- Organizations");

  // Insert organizations
  for (const org of organizations) {
    statements.push(
      `
INSERT INTO organizations (id, name, slug, plan, created_at, updated_at)
VALUES (
  '${org.id}',
  '${org.name}',
  '${org.slug}',
  '${org.plan}',
  '${now}',
  '${now}'
)
ON CONFLICT (id) DO NOTHING;
    `.trim()
    );
  }

  statements.push("");
  statements.push("-- Organization Memberships");

  // Insert organization memberships
  for (const org of organizations) {
    const memberId = randomUUID();
    statements.push(
      `
INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
VALUES (
  '${memberId}',
  '${org.id}',
  '${org.ownerId}',
  'owner',
  '${now}',
  '${now}'
)
ON CONFLICT (id) DO NOTHING;
    `.trim()
    );
  }

  statements.push("");
  statements.push("-- Custom Domains");

  // Insert custom domains
  for (const domain of customDomains) {
    statements.push(
      `
INSERT INTO domains (id, organization_id, name, is_custom, is_verified, created_at, updated_at)
VALUES (
  '${domain.id}',
  '${domain.organizationId}',
  '${domain.name}',
  ${domain.isCustom ? 1 : 0},
  ${domain.isVerified ? 1 : 0},
  '${now}',
  '${now}'
)
ON CONFLICT (name) DO NOTHING;
    `.trim()
    );
  }

  statements.push("");
  statements.push("-- Sample Links");

  // Insert sample links
  for (const link of sampleLinks) {
    statements.push(
      `
INSERT INTO links (id, organization_id, user_id, domain, slug, destination_url, title, click_count, created_at, updated_at)
VALUES (
  '${link.id}',
  '${link.organizationId}',
  '${link.userId}',
  '${link.domain}',
  '${link.slug}',
  '${link.destinationUrl}',
  '${link.title}',
  ${link.clickCount},
  '${now}',
  '${now}'
)
ON CONFLICT (domain, slug) DO NOTHING;
    `.trim()
    );
  }

  return statements.join("\n\n");
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--sql") || args.includes("-s")) {
    // Output SQL only (for piping to file)
    console.log(generateSeedSQL());
    return;
  }

  console.log("");
  console.log("🌱 Go2 Database Seed Script");
  console.log("===========================");
  console.log("");

  console.log("📋 Seed Data Summary:");
  console.log("");

  console.log("Default Domain:");
  console.log(`  • ${defaultDomain.name} (system domain)`);

  console.log("");
  console.log("Users:");
  for (const user of users) {
    console.log(`  • ${user.email} (${user.name})`);
  }

  console.log("");
  console.log("Organizations:");
  for (const org of organizations) {
    console.log(`  • ${org.name} (${org.slug}) - ${org.plan} plan`);
  }

  console.log("");
  console.log("Custom Domains:");
  for (const domain of customDomains) {
    console.log(`  • ${domain.name}`);
  }

  console.log("");
  console.log("Sample Links:");
  for (const link of sampleLinks) {
    console.log(`  • ${link.domain}/${link.slug} → ${link.destinationUrl}`);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("");
  console.log("📝 Generated SQL:");
  console.log("");
  console.log(generateSeedSQL());
  console.log("");
  console.log("=".repeat(60));
  console.log("");
  console.log("📌 To seed your D1 database, run:");
  console.log("");
  console.log("   # Generate SQL file");
  console.log("   pnpm seed --sql > seed.sql");
  console.log("");
  console.log("   # Execute on D1 (remote)");
  console.log("   wrangler d1 execute go2-db --file=seed.sql --remote");
  console.log("");
  console.log("   # Or for local development");
  console.log("   wrangler d1 execute go2-db --file=seed.sql --local");
  console.log("");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

/**
 * Slug Generation and Validation
 *
 * Utilities for generating and validating short link slugs.
 */

/**
 * Characters used for random slug generation
 * Using a URL-safe alphabet without ambiguous characters (0, O, l, I)
 */
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Default slug length
 */
const DEFAULT_SLUG_LENGTH = 7;

/**
 * Reserved slugs that cannot be used
 */
const RESERVED_SLUGS = new Set([
  // API routes
  "api",
  "v1",
  "v2",
  "graphql",
  "webhook",
  "webhooks",

  // Auth routes
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "callback",
  "verify",
  "reset",
  "password",

  // App routes
  "dashboard",
  "settings",
  "profile",
  "account",
  "billing",
  "admin",
  "app",
  "home",
  "links",
  "domains",
  "analytics",
  "stats",
  "team",
  "teams",
  "org",
  "orgs",
  "organization",
  "organizations",

  // Static/system
  "static",
  "assets",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "health",
  "healthz",
  "ready",
  "readyz",
  "status",
  "_next",

  // Marketing
  "pricing",
  "about",
  "contact",
  "blog",
  "docs",
  "help",
  "support",
  "terms",
  "privacy",
  "legal",
  "features",
  "enterprise",
  "compare",

  // Common words
  "go2",
  "link",
  "short",
  "url",
  "new",
  "create",
  "edit",
  "delete",
]);

/**
 * Generate a random slug
 */
export function generateSlug(length: number = DEFAULT_SLUG_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }

  return slug;
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Only allow alphanumeric, hyphens, and underscores
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 50;
}

/**
 * Sanitize a string to be used as a slug
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

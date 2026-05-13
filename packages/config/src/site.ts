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
  // GO2 - LINKS FOR AI AGENTS
  // ============================================
  // Use `||` (not `??`) so empty-string env vars (common from CI: `${{ vars.X }}`
  // resolves to "" when the variable is unset) fall back to defaults instead of
  // breaking `new URL(...)` consumers downstream.
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Go2",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "The agentic URL shortener",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Go2 is the agentic URL shortener. Branded, tracked, revocable short links — minted from your AI agent's tool call into the workspace you already own. One MCP install. Per-run attribution. Custom domain. Lifecycle controls. Edge-native on Cloudflare. Open source.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg",
  ogImage: "/og-image.png",
  creator: process.env.NEXT_PUBLIC_CREATOR_NAME || "Go2",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@go2.gg",
  links: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/buildwithrakesh",
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/rakesh1002/go2.gg",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || undefined,
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || undefined,
  },
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#E85B4F",
    defaultMode:
      (process.env.NEXT_PUBLIC_DEFAULT_THEME as "light" | "dark" | "system") || "light",
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
  // Page-level title — the layout's title.template ('%s | ${siteConfig.name}')
  // appends the brand. Don't pre-append it here or the brand renders twice.
  const title = options.title ?? `${siteConfig.name} - ${siteConfig.tagline}`;

  return {
    title,
    description: options.description ?? siteConfig.description,
    keywords: [
      "AI agents",
      "MCP server",
      "agent attribution",
      "per-run attribution",
      "agent link toolkit",
      "AI agent link platform",
      "Claude Code",
      "Claude Desktop",
      "Cursor",
      "Mastra",
      "Cloudflare Workers",
      "Dub.co alternative for AI agents",
    ],
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

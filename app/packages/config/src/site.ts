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
  // GO2 - THE EDGE-NATIVE LINK PLATFORM
  // ============================================
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Go2",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "The Edge-Native Link Platform",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Go2 is the fastest, developer-first link platform built on Cloudflare's edge network. Sub-10ms redirects globally. Open source, developer-ready, and privacy-first.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://go2.gg",
  ogImage: "/og-image.png",
  creator: process.env.NEXT_PUBLIC_CREATOR_NAME ?? "Go2",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@go2.gg",
  links: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://x.com/buildwithrakesh",
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/rakesh1002/go2.gg",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    discord: process.env.NEXT_PUBLIC_DISCORD_URL,
  },
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#E85B4F",
    defaultMode: (process.env.NEXT_PUBLIC_DEFAULT_THEME as "light" | "dark" | "system") ?? "light",
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

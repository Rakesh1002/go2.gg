/**
 * Competitor Migration Adapters
 *
 * Provides integration with competitor APIs for seamless data migration:
 * - Bitly
 * - Rebrandly
 * - Short.io
 * - TinyURL
 * - Dub.co
 *
 * Each adapter handles authentication, pagination, and field mapping
 * specific to that provider's API.
 */

import type { Env } from "../../bindings.js";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type MigrationProvider = "bitly" | "rebrandly" | "shortio" | "tinyurl" | "dub";

export interface MigrationCredentials {
  provider: MigrationProvider;
  apiKey?: string;
  accessToken?: string;
  groupGuid?: string; // Bitly group
  workspaceId?: string; // Rebrandly workspace
}

export interface MigratedLink {
  originalUrl: string;
  shortUrl: string;
  slug: string;
  domain: string;
  title?: string;
  tags?: string[];
  clickCount?: number;
  createdAt?: string;
  expiresAt?: string;
  password?: string;
  customFields?: Record<string, unknown>;
  originalId?: string; // ID from source provider
}

export interface MigrationResult {
  success: boolean;
  totalLinks: number;
  importedLinks: number;
  skippedLinks: number;
  failedLinks: number;
  errors: Array<{ link: string; error: string }>;
  links: MigratedLink[];
}

export interface MigrationProgress {
  id: string;
  provider: MigrationProvider;
  status: "pending" | "running" | "completed" | "failed";
  totalLinks: number;
  processedLinks: number;
  importedLinks: number;
  skippedLinks: number;
  failedLinks: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Provider Configurations
// -----------------------------------------------------------------------------

export const PROVIDER_CONFIG = {
  bitly: {
    name: "Bitly",
    baseUrl: "https://api-ssl.bitly.com/v4",
    authType: "bearer" as const,
    docsUrl: "https://dev.bitly.com/",
    apiKeyInstructions: "Go to Bitly Settings → Developer settings → API → Generate Access Token",
    features: ["links", "tags", "custom_domains", "click_counts"],
    rateLimit: 100, // requests per minute
  },
  rebrandly: {
    name: "Rebrandly",
    baseUrl: "https://api.rebrandly.com/v1",
    authType: "apikey" as const,
    docsUrl: "https://developers.rebrandly.com/",
    apiKeyInstructions: "Go to Rebrandly → Account → API Keys → Create new API key",
    features: ["links", "tags", "custom_domains", "click_counts", "utm_params", "scripts"],
    rateLimit: 10, // requests per second
  },
  shortio: {
    name: "Short.io",
    baseUrl: "https://api.short.io",
    authType: "apikey" as const,
    docsUrl: "https://developers.short.io/",
    apiKeyInstructions: "Go to Short.io → Integrations → API → Copy your API key",
    features: ["links", "tags", "custom_domains", "click_counts", "expiration"],
    rateLimit: 60, // requests per minute
  },
  tinyurl: {
    name: "TinyURL",
    baseUrl: "https://api.tinyurl.com",
    authType: "bearer" as const,
    docsUrl: "https://tinyurl.com/app/dev",
    apiKeyInstructions: "Go to TinyURL → Developer → Generate API token",
    features: ["links", "analytics"],
    rateLimit: 60, // requests per minute
  },
  dub: {
    name: "Dub.co",
    baseUrl: "https://api.dub.co",
    authType: "bearer" as const,
    docsUrl: "https://dub.co/docs/api-reference",
    apiKeyInstructions: "Go to Dub.co → Settings → API Keys → Create new API key",
    features: [
      "links",
      "tags",
      "custom_domains",
      "click_counts",
      "utm_params",
      "geo_targeting",
      "device_targeting",
    ],
    rateLimit: 600, // requests per minute
  },
};

// -----------------------------------------------------------------------------
// Bitly Adapter
// -----------------------------------------------------------------------------

interface BitlyLink {
  id: string;
  link: string;
  long_url: string;
  title?: string;
  tags?: string[];
  created_at: string;
  custom_bitlinks?: string[];
  deeplinks?: unknown[];
}

interface BitlyResponse {
  links: BitlyLink[];
  pagination?: {
    total: number;
    size: number;
    page: number;
    next?: string;
  };
}

async function fetchBitlyLinks(credentials: MigrationCredentials): Promise<MigratedLink[]> {
  const links: MigratedLink[] = [];
  let nextUrl: string | null =
    `${PROVIDER_CONFIG.bitly.baseUrl}/groups/${credentials.groupGuid}/bitlinks?size=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bitly API error: ${response.status} - ${error}`);
    }

    const data: BitlyResponse = await response.json();

    for (const link of data.links) {
      const urlParts = new URL(link.link);
      links.push({
        originalUrl: link.long_url,
        shortUrl: link.link,
        slug: urlParts.pathname.slice(1), // Remove leading /
        domain: urlParts.hostname,
        title: link.title,
        tags: link.tags,
        createdAt: link.created_at,
        originalId: link.id,
      });
    }

    // Handle pagination
    if (data.pagination?.next) {
      nextUrl = data.pagination.next;
    } else {
      nextUrl = null;
    }
  }

  return links;
}

async function fetchBitlyGroups(
  accessToken: string
): Promise<Array<{ guid: string; name: string }>> {
  const response = await fetch(`${PROVIDER_CONFIG.bitly.baseUrl}/groups`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Bitly groups: ${response.status}`);
  }

  const data: { groups: Array<{ guid: string; name: string }> } = await response.json();
  return data.groups;
}

// -----------------------------------------------------------------------------
// Rebrandly Adapter
// -----------------------------------------------------------------------------

interface RebrandlyLink {
  id: string;
  shortUrl: string;
  destination: string;
  title?: string;
  slashtag: string;
  domain?: { fullName: string };
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
  clicks: number;
  scripts?: unknown[];
}

async function fetchRebrandlyLinks(credentials: MigrationCredentials): Promise<MigratedLink[]> {
  const links: MigratedLink[] = [];
  let offset = 0;
  const limit = 25; // Rebrandly max per page
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${PROVIDER_CONFIG.rebrandly.baseUrl}/links`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    if (credentials.workspaceId) {
      url.searchParams.set("workspace", credentials.workspaceId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        apikey: credentials.apiKey!,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Rebrandly API error: ${response.status} - ${error}`);
    }

    const data: RebrandlyLink[] = await response.json();

    for (const link of data) {
      links.push({
        originalUrl: link.destination,
        shortUrl: link.shortUrl,
        slug: link.slashtag,
        domain: link.domain?.fullName ?? "rebrand.ly",
        title: link.title,
        tags: link.tags?.map((t) => t.name),
        clickCount: link.clicks,
        createdAt: link.createdAt,
        originalId: link.id,
      });
    }

    // Check for more pages
    if (data.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return links;
}

async function fetchRebrandlyWorkspaces(
  apiKey: string
): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch(`${PROVIDER_CONFIG.rebrandly.baseUrl}/workspaces`, {
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Rebrandly workspaces: ${response.status}`);
  }

  const data: Array<{ id: string; name: string }> = await response.json();
  return data;
}

// -----------------------------------------------------------------------------
// Short.io Adapter
// -----------------------------------------------------------------------------

interface ShortioLink {
  id: string;
  originalURL: string;
  shortURL: string;
  path: string;
  title?: string;
  tags?: string[];
  createdAt: number;
  expiresAt?: number;
  clicks: number;
  DomainId: number;
  domain?: string;
}

interface ShortioResponse {
  links: ShortioLink[];
  count: number;
}

async function fetchShortioLinks(credentials: MigrationCredentials): Promise<MigratedLink[]> {
  const links: MigratedLink[] = [];
  let offset = 0;
  const limit = 150; // Short.io max per page
  let hasMore = true;

  // First get domains
  const domainsResponse = await fetch(`${PROVIDER_CONFIG.shortio.baseUrl}/api/domains`, {
    headers: {
      Authorization: credentials.apiKey!,
      "Content-Type": "application/json",
    },
  });

  if (!domainsResponse.ok) {
    throw new Error(`Failed to fetch Short.io domains: ${domainsResponse.status}`);
  }

  const domains: Array<{ id: number; hostname: string }> = await domainsResponse.json();
  const domainMap = new Map(domains.map((d) => [d.id, d.hostname]));

  // Fetch links for each domain
  for (const domain of domains) {
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${PROVIDER_CONFIG.shortio.baseUrl}/api/links?domain_id=${domain.id}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: credentials.apiKey!,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Short.io API error: ${response.status} - ${error}`);
      }

      const data: ShortioResponse = await response.json();

      for (const link of data.links) {
        links.push({
          originalUrl: link.originalURL,
          shortUrl: link.shortURL,
          slug: link.path,
          domain: domainMap.get(link.DomainId) ?? domain.hostname,
          title: link.title,
          tags: link.tags,
          clickCount: link.clicks,
          createdAt: new Date(link.createdAt).toISOString(),
          expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString() : undefined,
          originalId: link.id,
        });
      }

      if (data.links.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
  }

  return links;
}

// -----------------------------------------------------------------------------
// Dub.co Adapter
// -----------------------------------------------------------------------------

interface DubLink {
  id: string;
  url: string;
  shortLink: string;
  key: string;
  domain: string;
  title?: string;
  description?: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  clicks: number;
  createdAt: string;
  expiresAt?: string;
  password?: string;
  ios?: string;
  android?: string;
  geo?: Record<string, string>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface DubResponse {
  result: DubLink[];
  nextCursor?: string;
}

async function fetchDubLinks(credentials: MigrationCredentials): Promise<MigratedLink[]> {
  const links: MigratedLink[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${PROVIDER_CONFIG.dub.baseUrl}/links`);
    url.searchParams.set("pageSize", "100");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dub.co API error: ${response.status} - ${error}`);
    }

    const data: DubResponse = await response.json();

    for (const link of data.result) {
      links.push({
        originalUrl: link.url,
        shortUrl: link.shortLink,
        slug: link.key,
        domain: link.domain,
        title: link.title,
        tags: link.tags?.map((t) => t.name),
        clickCount: link.clicks,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        password: link.password,
        originalId: link.id,
        customFields: {
          ios: link.ios,
          android: link.android,
          geo: link.geo,
          utm_source: link.utm_source,
          utm_medium: link.utm_medium,
          utm_campaign: link.utm_campaign,
        },
      });
    }

    cursor = data.nextCursor;
  } while (cursor);

  return links;
}

// -----------------------------------------------------------------------------
// TinyURL Adapter
// -----------------------------------------------------------------------------

interface TinyURLLink {
  alias: string;
  url: string;
  domain: string;
  created_at: string;
  analytics?: {
    enabled: boolean;
  };
}

interface TinyURLResponse {
  data: {
    urls: TinyURLLink[];
    has_more: boolean;
    cursor?: string;
  };
}

async function fetchTinyURLLinks(credentials: MigrationCredentials): Promise<MigratedLink[]> {
  const links: MigratedLink[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${PROVIDER_CONFIG.tinyurl.baseUrl}/alias`);
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TinyURL API error: ${response.status} - ${error}`);
    }

    const data: TinyURLResponse = await response.json();

    for (const link of data.data.urls) {
      links.push({
        originalUrl: link.url,
        shortUrl: `https://${link.domain}/${link.alias}`,
        slug: link.alias,
        domain: link.domain,
        createdAt: link.created_at,
        originalId: link.alias,
      });
    }

    hasMore = data.data.has_more;
    cursor = data.data.cursor;
  }

  return links;
}

// -----------------------------------------------------------------------------
// Main Migration Functions
// -----------------------------------------------------------------------------

/**
 * Validate credentials by making a test API call
 */
export async function validateCredentials(
  credentials: MigrationCredentials
): Promise<{ valid: boolean; error?: string; metadata?: Record<string, unknown> }> {
  try {
    switch (credentials.provider) {
      case "bitly": {
        const groups = await fetchBitlyGroups(credentials.accessToken!);
        return {
          valid: true,
          metadata: { groups, defaultGroup: groups[0]?.guid },
        };
      }

      case "rebrandly": {
        const workspaces = await fetchRebrandlyWorkspaces(credentials.apiKey!);
        return {
          valid: true,
          metadata: { workspaces },
        };
      }

      case "shortio": {
        const response = await fetch(`${PROVIDER_CONFIG.shortio.baseUrl}/api/domains`, {
          headers: {
            Authorization: credentials.apiKey!,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          return { valid: false, error: "Invalid API key" };
        }
        const domains = await response.json();
        return { valid: true, metadata: { domains } };
      }

      case "tinyurl": {
        const response = await fetch(`${PROVIDER_CONFIG.tinyurl.baseUrl}/alias`, {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          return { valid: false, error: "Invalid access token" };
        }
        return { valid: true };
      }

      case "dub": {
        const response = await fetch(`${PROVIDER_CONFIG.dub.baseUrl}/links`, {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: "Unknown provider" };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Fetch links from a competitor provider
 */
export async function fetchLinksFromProvider(
  credentials: MigrationCredentials
): Promise<MigratedLink[]> {
  switch (credentials.provider) {
    case "bitly":
      return fetchBitlyLinks(credentials);
    case "rebrandly":
      return fetchRebrandlyLinks(credentials);
    case "shortio":
      return fetchShortioLinks(credentials);
    case "tinyurl":
      return fetchTinyURLLinks(credentials);
    case "dub":
      return fetchDubLinks(credentials);
    default:
      throw new Error(`Unknown provider: ${credentials.provider}`);
  }
}

/**
 * Get provider information and setup instructions
 */
export function getProviderInfo(provider: MigrationProvider) {
  return PROVIDER_CONFIG[provider];
}

/**
 * List all supported providers
 */
export function listProviders() {
  return Object.entries(PROVIDER_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    docsUrl: config.docsUrl,
    features: config.features,
    authType: config.authType,
  }));
}

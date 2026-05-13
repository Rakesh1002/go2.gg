/**
 * IndexNow API Integration
 *
 * IndexNow is a protocol that enables websites to instantly inform search engines
 * about content changes. Supported by Bing, Yahoo, Yandex, and others.
 *
 * @see https://www.indexnow.org/documentation
 */

import { siteConfig } from "@repo/config";

export interface IndexNowOptions {
  /** URLs to submit for indexing (max 10,000 per request) */
  urls: string[];
  /** Optional: Override the default key */
  key?: string;
  /** Optional: Override the key location */
  keyLocation?: string;
}

export interface IndexNowResponse {
  success: boolean;
  statusCode: number;
  message: string;
  engine: string;
}

// IndexNow endpoints for different search engines
const INDEXNOW_ENDPOINTS = {
  bing: "https://www.bing.com/indexnow",
  yandex: "https://yandex.com/indexnow",
  seznam: "https://search.seznam.cz/indexnow",
  naver: "https://searchadvisor.naver.com/indexnow",
} as const;

/**
 * Get the IndexNow API key from environment
 */
export function getIndexNowKey(): string {
  const key = process.env.INDEXNOW_API_KEY;
  if (!key) {
    throw new Error("INDEXNOW_API_KEY environment variable is not set");
  }
  return key;
}

/**
 * Submit URLs to IndexNow API
 *
 * IndexNow allows you to notify search engines about URL changes instantly.
 * When you submit to one endpoint, it's shared with all participating engines.
 *
 * @param options - IndexNow submission options
 * @returns Results from each search engine endpoint
 */
export async function submitToIndexNow(
  options: IndexNowOptions
): Promise<IndexNowResponse[]> {
  const { urls, key = getIndexNowKey(), keyLocation } = options;

  if (urls.length === 0) {
    return [];
  }

  if (urls.length > 10000) {
    throw new Error("IndexNow API supports maximum 10,000 URLs per request");
  }

  const host = new URL(siteConfig.url).host;
  const results: IndexNowResponse[] = [];

  // Submit to Bing (primary - it shares with other participating engines)
  // But we'll also submit to others for redundancy
  for (const [engine, endpoint] of Object.entries(INDEXNOW_ENDPOINTS)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          host,
          key,
          // keyLocation is optional - if not provided, search engines look for /{key}.txt
          ...(keyLocation && { keyLocation }),
          urlList: urls,
        }),
      });

      // IndexNow returns different status codes:
      // 200 - OK, URL submitted successfully
      // 202 - Accepted, URL received, will be processed later
      // 400 - Bad request, invalid format
      // 403 - Forbidden, key not valid
      // 422 - Unprocessable Entity, URLs don't belong to host
      // 429 - Too Many Requests, rate limited

      let message: string;
      switch (response.status) {
        case 200:
          message = "URL submitted successfully";
          break;
        case 202:
          message = "URL received, will be processed later";
          break;
        case 400:
          message = "Bad request - invalid format";
          break;
        case 403:
          message = "Forbidden - key not valid for this host";
          break;
        case 422:
          message = "URLs don't belong to the specified host";
          break;
        case 429:
          message = "Rate limited - too many requests";
          break;
        default:
          message = `Unexpected status: ${response.status}`;
      }

      results.push({
        success: response.status === 200 || response.status === 202,
        statusCode: response.status,
        message,
        engine,
      });
    } catch (error) {
      results.push({
        success: false,
        statusCode: 0,
        message: error instanceof Error ? error.message : "Unknown error",
        engine,
      });
    }
  }

  return results;
}

/**
 * Submit a single URL to IndexNow
 */
export async function submitUrlToIndexNow(url: string): Promise<IndexNowResponse[]> {
  return submitToIndexNow({ urls: [url] });
}

/**
 * Submit all sitemap URLs to IndexNow
 * Useful for initial indexing or after major content updates
 */
export async function submitSitemapToIndexNow(
  sitemapUrls: string[]
): Promise<IndexNowResponse[]> {
  // IndexNow supports up to 10,000 URLs per request
  // Split into batches if needed
  const batchSize = 10000;
  const results: IndexNowResponse[] = [];

  for (let i = 0; i < sitemapUrls.length; i += batchSize) {
    const batch = sitemapUrls.slice(i, i + batchSize);
    const batchResults = await submitToIndexNow({ urls: batch });
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate the IndexNow key verification file content
 * This file should be placed at /{key}.txt in your public directory
 */
export function generateKeyFile(): string {
  return getIndexNowKey();
}

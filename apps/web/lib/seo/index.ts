/**
 * SEO Indexing Service
 *
 * Unified service for submitting URLs to search engines for indexing.
 * Supports both IndexNow (Bing/Yahoo/Yandex) and Google Indexing API.
 */

export * from "./indexnow";
export * from "./google-indexing";

import { siteConfig } from "@repo/config";
import { submitToIndexNow, type IndexNowResponse } from "./indexnow";
import {
  submitToGoogleIndexing,
  submitBatchToGoogleIndexing,
  submitSitemapToGoogle,
  type GoogleIndexingResponse,
} from "./google-indexing";

export interface UnifiedIndexingResult {
  url: string;
  google?: GoogleIndexingResponse;
  indexNow?: IndexNowResponse[];
  timestamp: string;
}

export interface BulkIndexingResult {
  totalUrls: number;
  successCount: number;
  failureCount: number;
  results: UnifiedIndexingResult[];
  googleSitemap?: { success: boolean; message: string };
}

/**
 * Submit a URL to all search engines
 */
export async function submitUrlToAllEngines(
  url: string
): Promise<UnifiedIndexingResult> {
  const [googleResult, indexNowResults] = await Promise.all([
    submitToGoogleIndexing({ url, type: "URL_UPDATED" }).catch((e) => ({
      success: false,
      url,
      type: "URL_UPDATED",
      error: e.message,
    })),
    submitToIndexNow({ urls: [url] }).catch(() => []),
  ]);

  return {
    url,
    google: googleResult as GoogleIndexingResponse,
    indexNow: indexNowResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Submit multiple URLs to all search engines
 */
export async function submitUrlsToAllEngines(
  urls: string[]
): Promise<BulkIndexingResult> {
  const results: UnifiedIndexingResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Submit to IndexNow in bulk (supports up to 10,000 URLs)
  const indexNowPromise = submitToIndexNow({ urls }).catch(() => []);

  // Submit to Google individually (has quota limits)
  const googlePromise = submitBatchToGoogleIndexing(urls).catch((e) => ({
    success: false,
    results: [],
    errors: [e.message],
  }));

  // Also submit sitemap to Google
  const sitemapPromise = submitSitemapToGoogle().catch((e) => ({
    success: false,
    message: e.message,
  }));

  const [indexNowResults, googleResults, sitemapResult] = await Promise.all([
    indexNowPromise,
    googlePromise,
    sitemapPromise,
  ]);

  // Combine results
  for (const url of urls) {
    const googleResult = googleResults.results.find((r) => r.url === url);
    const success = googleResult?.success || indexNowResults.some((r) => r.success);

    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    results.push({
      url,
      google: googleResult,
      indexNow: indexNowResults,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    totalUrls: urls.length,
    successCount,
    failureCount,
    results,
    googleSitemap: sitemapResult,
  };
}

/**
 * Submit all sitemap URLs to search engines
 * Call this after publishing new content or on a schedule
 */
export async function submitSitemapUrls(
  sitemapUrls: string[]
): Promise<BulkIndexingResult> {
  return submitUrlsToAllEngines(sitemapUrls);
}

/**
 * Generate all public URLs from the sitemap configuration
 */
export function generateSitemapUrls(): string[] {
  const baseUrl = siteConfig.url;

  // Static pages
  const staticPages = [
    "",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/changelog",
    "/blog",
    "/docs",
    "/terms",
    "/privacy",
    "/cookies",
    "/acceptable-use",
    "/dpa",
  ];

  return staticPages.map((path) => `${baseUrl}${path}`);
}

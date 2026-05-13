#!/usr/bin/env npx tsx
/**
 * Submit URLs to Search Engines
 *
 * CLI script to submit URLs to Google, Bing, Yahoo, and Yandex.
 *
 * Usage:
 *   # Submit sitemap URLs to all search engines
 *   npx tsx scripts/submit-to-search-engines.ts --sitemap
 *
 *   # Submit specific URL to all search engines
 *   npx tsx scripts/submit-to-search-engines.ts --url https://go2.gg/pricing
 *
 *   # Submit to IndexNow only (Bing/Yahoo/Yandex)
 *   npx tsx scripts/submit-to-search-engines.ts --indexnow --url https://go2.gg/new-page
 *
 *   # Submit sitemap to Google only
 *   npx tsx scripts/submit-to-search-engines.ts --google --sitemap
 *
 * Environment variables required:
 *   - INDEXNOW_API_KEY (for IndexNow/Bing/Yahoo/Yandex)
 *   - GOOGLE_INDEXING_CLIENT_EMAIL (for Google)
 *   - GOOGLE_INDEXING_PRIVATE_KEY (for Google)
 *   - NEXT_PUBLIC_APP_URL (site URL)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg";

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = {
  bing: "https://www.bing.com/indexnow",
  yandex: "https://yandex.com/indexnow",
  seznam: "https://search.seznam.cz/indexnow",
  naver: "https://searchadvisor.naver.com/indexnow",
};

// Static pages from sitemap
const STATIC_PAGES = [
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

async function submitToIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_API_KEY;
  if (!key) {
    console.error("❌ INDEXNOW_API_KEY not set");
    return;
  }

  const host = new URL(siteUrl).host;
  console.log(`\n📤 Submitting ${urls.length} URLs to IndexNow...`);

  for (const [engine, endpoint] of Object.entries(INDEXNOW_ENDPOINTS)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key,
          // IndexNow will look for /{key}.txt by default
          urlList: urls,
        }),
      });

      const status = response.status;
      const statusEmoji =
        status === 200 || status === 202 ? "✅" : status === 429 ? "⏳" : "❌";

      console.log(`  ${statusEmoji} ${engine}: ${status} ${response.statusText}`);
    } catch (error) {
      console.log(`  ❌ ${engine}: ${error}`);
    }
  }
}

async function generateGoogleJWT() {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Indexing API credentials not set");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url");

  const signatureInput = `${encode(header)}.${encode(payload)}`;

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, "base64url");

  return `${signatureInput}.${signature}`;
}

async function getGoogleAccessToken() {
  const jwt = await generateGoogleJWT();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function submitToGoogle(urls: string[]) {
  console.log(`\n📤 Submitting ${urls.length} URLs to Google Indexing API...`);

  try {
    const accessToken = await getGoogleAccessToken();
    let success = 0;
    let failed = 0;

    for (const url of urls) {
      try {
        const response = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ url, type: "URL_UPDATED" }),
          }
        );

        if (response.ok) {
          console.log(`  ✅ ${url}`);
          success++;
        } else {
          const error = await response.json();
          console.log(`  ❌ ${url}: ${error.error?.message || response.status}`);
          failed++;
        }

        // Respect rate limits
        await new Promise((r) => setTimeout(r, 100));
      } catch (error) {
        console.log(`  ❌ ${url}: ${error}`);
        failed++;
      }
    }

    console.log(`\n  Summary: ${success} succeeded, ${failed} failed`);
  } catch (error) {
    console.error(`❌ Google API error: ${error}`);
  }
}

async function submitSitemapToGoogle() {
  console.log(`\n📤 Submitting sitemap to Google Search Console...`);

  try {
    const accessToken = await getGoogleAccessToken();
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl);

    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      console.log(`  ✅ Sitemap submitted: ${sitemapUrl}`);
    } else {
      const error = await response.json();
      console.log(`  ❌ Failed: ${error.error?.message || response.status}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  const sitemap = args.includes("--sitemap");
  const indexNowOnly = args.includes("--indexnow");
  const googleOnly = args.includes("--google");
  const urlIndex = args.indexOf("--url");
  const specificUrl = urlIndex !== -1 ? args[urlIndex + 1] : null;

  console.log("🔍 Search Engine Submission Tool\n");
  console.log(`Site: ${siteUrl}`);

  let urls: string[] = [];

  if (specificUrl) {
    urls = [specificUrl];
  } else if (sitemap) {
    urls = STATIC_PAGES.map((path) => `${siteUrl}${path}`);
  } else {
    console.log(`
Usage:
  npx tsx scripts/submit-to-search-engines.ts --sitemap          # Submit all sitemap URLs
  npx tsx scripts/submit-to-search-engines.ts --url <url>        # Submit specific URL
  npx tsx scripts/submit-to-search-engines.ts --google --sitemap # Google only
  npx tsx scripts/submit-to-search-engines.ts --indexnow --url   # IndexNow only
`);
    return;
  }

  console.log(`URLs to submit: ${urls.length}`);
  urls.forEach((u) => console.log(`  - ${u}`));

  if (!googleOnly) {
    await submitToIndexNow(urls);
  }

  if (!indexNowOnly) {
    await submitToGoogle(urls);

    if (sitemap) {
      await submitSitemapToGoogle();
    }
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);

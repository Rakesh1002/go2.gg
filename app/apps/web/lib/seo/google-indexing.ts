/**
 * Google Search Console Indexing API
 *
 * Enables programmatic URL submission to Google for indexing.
 * Requires a Google Cloud service account with Indexing API access.
 *
 * Setup:
 * 1. Create a Google Cloud project
 * 2. Enable the Indexing API
 * 3. Create a service account and download the JSON key
 * 4. Add the service account email as an owner in Search Console
 *
 * @see https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

import { siteConfig } from "@repo/config";

export interface GoogleIndexingCredentials {
  client_email: string;
  private_key: string;
}

export interface GoogleIndexingOptions {
  /** URL to submit for indexing */
  url: string;
  /** Type of notification */
  type: "URL_UPDATED" | "URL_DELETED";
}

export interface GoogleIndexingResponse {
  success: boolean;
  url: string;
  type: string;
  notifyTime?: string;
  error?: string;
}

export interface GoogleBatchIndexingResponse {
  success: boolean;
  results: GoogleIndexingResponse[];
  errors: string[];
}

/**
 * Get Google service account credentials from environment
 */
function getCredentials(): GoogleIndexingCredentials {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Indexing API credentials not configured. " +
        "Set GOOGLE_INDEXING_CLIENT_EMAIL and GOOGLE_INDEXING_PRIVATE_KEY"
    );
  }

  return {
    client_email: clientEmail,
    // Handle escaped newlines in environment variables
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

/**
 * Generate a JWT for Google API authentication
 * Using the Web Crypto API for edge compatibility
 */
async function generateJWT(credentials: GoogleIndexingCredentials): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKeyPem = credentials.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Get an access token from Google OAuth
 */
async function getAccessToken(): Promise<string> {
  const credentials = getCredentials();
  const jwt = await generateJWT(credentials);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Submit a single URL to Google Indexing API
 */
export async function submitToGoogleIndexing(
  options: GoogleIndexingOptions
): Promise<GoogleIndexingResponse> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url: options.url,
          type: options.type,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        url: options.url,
        type: options.type,
        error: error.error?.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.urlNotificationMetadata?.url || options.url,
      type: options.type,
      notifyTime: data.urlNotificationMetadata?.latestUpdate?.notifyTime,
    };
  } catch (error) {
    return {
      success: false,
      url: options.url,
      type: options.type,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Submit multiple URLs to Google Indexing API
 * Uses batch requests for efficiency (max 100 per batch)
 */
export async function submitBatchToGoogleIndexing(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<GoogleBatchIndexingResponse> {
  const results: GoogleIndexingResponse[] = [];
  const errors: string[] = [];

  // Google Indexing API has quota limits:
  // - 200 requests per day for most sites
  // - Can request quota increase for larger sites

  // Process URLs sequentially to respect rate limits
  // Consider implementing a queue for production use
  for (const url of urls) {
    const result = await submitToGoogleIndexing({ url, type });
    results.push(result);

    if (!result.success && result.error) {
      errors.push(`${url}: ${result.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Submit sitemap URL to Google Search Console
 * Note: This uses the Search Console API, not the Indexing API
 */
export async function submitSitemapToGoogle(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const sitemapUrl = `${siteConfig.url}/sitemap.xml`;
    const siteUrl = siteConfig.url;

    // URL encode the site URL for the API path
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl);

    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.error?.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      message: `Sitemap ${sitemapUrl} submitted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get URL notification metadata from Google
 */
export async function getGoogleIndexingStatus(
  url: string
): Promise<{
  success: boolean;
  latestUpdate?: {
    url: string;
    type: string;
    notifyTime: string;
  };
  error?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const encodedUrl = encodeURIComponent(url);

    const response = await fetch(
      `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodedUrl}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      latestUpdate: data.latestUpdate,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

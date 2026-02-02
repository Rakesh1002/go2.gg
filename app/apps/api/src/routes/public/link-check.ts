/**
 * Public Link Check API
 *
 * Free tool to check URL safety:
 * - POST /public/link-check - Check a URL for safety
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { ok, badRequest, tooManyRequests } from "../../lib/response.js";

const linkCheck = new Hono<{ Bindings: Env }>();

const checkSchema = z.object({
  url: z.string().url("Invalid URL"),
});

interface SafeBrowsingResult {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threatEntryType: string;
  }>;
}

/**
 * POST /public/link-check
 * Check a URL for safety
 */
linkCheck.post("/", zValidator("json", checkSchema), async (c) => {
  const { url } = c.req.valid("json");

  // Rate limiting using IP (simple implementation)
  const clientIP = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
  const rateLimitKey = `link-check:${clientIP}`;

  // Check rate limit (10 requests per minute)
  const rateLimitResult = await c.env.LINKS_KV.get(rateLimitKey);
  const requestCount = rateLimitResult ? parseInt(rateLimitResult, 10) : 0;

  if (requestCount >= 10) {
    return tooManyRequests(c, "Rate limit exceeded. Please try again in a minute.");
  }

  // Increment rate limit counter
  await c.env.LINKS_KV.put(rateLimitKey, String(requestCount + 1), {
    expirationTtl: 60, // 1 minute
  });

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const hasSSL = parsedUrl.protocol === "https:";

    // Simulate redirect chain discovery
    const redirectChain: string[] = [url];
    let finalUrl = url;
    let statusCode = 200;

    try {
      // Follow redirects to get final URL
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
      });
      finalUrl = response.url;
      statusCode = response.status;

      // If URL is different, there were redirects
      if (finalUrl !== url) {
        redirectChain.push(finalUrl);
      }
    } catch {
      // URL might be unreachable
    }

    // Check against known malicious patterns (simplified)
    const warnings: string[] = [];
    const details = {
      malware: false,
      phishing: false,
      unwantedSoftware: false,
      domain,
      statusCode,
    };

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /free.*gift/i,
      /you.*won/i,
      /claim.*prize/i,
      /urgent.*action/i,
      /account.*suspended/i,
      /verify.*identity/i,
    ];

    const suspiciousDomains = ["bit.do", "is.gd", "t.cn"];

    // Check path for suspicious patterns
    const pathAndQuery = parsedUrl.pathname + parsedUrl.search;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(pathAndQuery)) {
        warnings.push("URL contains potentially deceptive text patterns");
        break;
      }
    }

    // Check for suspicious domain patterns
    if (suspiciousDomains.some((d) => domain.includes(d))) {
      warnings.push("This URL shortener has been associated with spam");
    }

    // Check for IP-based URLs (common in phishing)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      warnings.push("URL uses an IP address instead of a domain name");
      details.phishing = true;
    }

    // Check for homograph attacks (similar-looking domains)
    const commonTargets = [
      "google",
      "facebook",
      "amazon",
      "apple",
      "microsoft",
      "paypal",
      "netflix",
    ];
    for (const target of commonTargets) {
      if (
        domain.includes(target) &&
        !domain.endsWith(`.${target}.com`) &&
        domain !== `${target}.com`
      ) {
        warnings.push(`Domain may be impersonating ${target}`);
        details.phishing = true;
        break;
      }
    }

    // Check SSL
    if (!hasSSL) {
      warnings.push("Site does not use HTTPS encryption");
    }

    // If using Google Safe Browsing API (optional, requires API key)
    // This is a placeholder - in production, use the actual API
    /*
    if (c.env.GOOGLE_SAFE_BROWSING_KEY) {
      const safeBrowsingResult = await checkGoogleSafeBrowsing(
        c.env.GOOGLE_SAFE_BROWSING_KEY,
        url
      );
      if (safeBrowsingResult.matches?.length) {
        for (const match of safeBrowsingResult.matches) {
          if (match.threatType === "MALWARE") {
            details.malware = true;
            warnings.push("Google Safe Browsing detected malware");
          }
          if (match.threatType === "SOCIAL_ENGINEERING") {
            details.phishing = true;
            warnings.push("Google Safe Browsing detected phishing");
          }
          if (match.threatType === "UNWANTED_SOFTWARE") {
            details.unwantedSoftware = true;
            warnings.push("Google Safe Browsing detected unwanted software");
          }
        }
      }
    }
    */

    const isSafe = !details.malware && !details.phishing && !details.unwantedSoftware;

    return ok(c, {
      url,
      isSafe,
      hasSSL,
      redirectChain,
      finalUrl,
      warnings,
      details,
    });
  } catch {
    return badRequest(c, "Failed to check URL. Please verify the URL is correct.");
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkGoogleSafeBrowsing(apiKey: string, url: string): Promise<SafeBrowsingResult> {
  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: {
          clientId: "go2",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    }
  );

  return response.json();
}

export { linkCheck };

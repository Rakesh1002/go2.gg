/**
 * AI-Powered Slug Generation
 *
 * Uses Cloudflare Workers AI to generate memorable, relevant slugs
 * based on the destination URL content.
 */

import { sanitizeSlug, isReservedSlug, generateSlug } from "./slug.js";

/**
 * Extract meaningful context from a URL
 */
function extractUrlContext(url: string): {
  domain: string;
  path: string;
  keywords: string[];
} {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;

    // Extract keywords from path
    const pathParts = path.split(/[/\-_.]/).filter((p) => p.length > 2 && !/^\d+$/.test(p));

    // Extract keywords from domain
    const domainParts = domain
      .split(".")
      .slice(0, -1) // Remove TLD
      .flatMap((p) => p.split(/[-_]/))
      .filter((p) => p.length > 2);

    // Extract query params that might be useful
    const queryKeywords: string[] = [];
    parsed.searchParams.forEach((value, key) => {
      if (["title", "name", "q", "query", "product", "item"].includes(key.toLowerCase())) {
        queryKeywords.push(...value.split(/[\s+_-]/).filter((w) => w.length > 2));
      }
    });

    return {
      domain,
      path,
      keywords: [...domainParts, ...pathParts, ...queryKeywords].slice(0, 10),
    };
  } catch {
    return { domain: "", path: "", keywords: [] };
  }
}

/**
 * Generate AI-powered slug suggestions
 */
export async function generateAISlugs(
  ai: Ai,
  destinationUrl: string,
  options?: {
    count?: number;
    maxLength?: number;
    style?: "short" | "memorable" | "professional";
  }
): Promise<string[]> {
  const count = options?.count ?? 5;
  const maxLength = options?.maxLength ?? 12;
  const style = options?.style ?? "memorable";

  const context = extractUrlContext(destinationUrl);

  // If we can't extract context, fall back to random slugs
  if (context.keywords.length === 0 && !context.domain) {
    return Array.from({ length: count }, () => generateSlug(7));
  }

  const styleGuidance = {
    short: "very short (3-5 chars), like abbreviations or acronyms",
    memorable: "catchy and easy to remember, using simple words",
    professional: "clean and professional, suitable for business use",
  };

  const prompt = `Generate ${count} unique short URL slugs for a link to: ${destinationUrl}

Context:
- Domain: ${context.domain}
- Path keywords: ${context.keywords.join(", ") || "none"}

Requirements:
- Each slug must be ${maxLength} characters or less
- Style: ${styleGuidance[style]}
- Use only lowercase letters, numbers, and hyphens
- No spaces or special characters
- Make them relevant to the content
- Each slug should be unique and creative

Return ONLY the slugs, one per line, no numbering or explanations.`;

  try {
    // Use Cloudflare's text generation model
    // Cast to any to handle model name type checking (models are frequently updated)
    const response = await (ai as { run: (model: string, input: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 200,
      }
    );

    // Parse the response
    const text =
      typeof response === "string"
        ? response
        : ((response as { response?: string }).response ?? "");

    const suggestions = text
      .split("\n")
      .map((line) => sanitizeSlug(line.trim()))
      .filter((slug) => {
        return (
          slug.length >= 2 &&
          slug.length <= maxLength &&
          !isReservedSlug(slug) &&
          /^[a-z0-9-]+$/.test(slug)
        );
      })
      .slice(0, count);

    // If AI didn't return enough suggestions, add random ones
    while (suggestions.length < count) {
      suggestions.push(generateSlug(7));
    }

    // Ensure uniqueness
    return [...new Set(suggestions)].slice(0, count);
  } catch (error) {
    console.error("AI slug generation failed:", error);
    // Fall back to random slugs
    return Array.from({ length: count }, () => generateSlug(7));
  }
}

/**
 * Generate a single AI-powered slug (for auto-fill)
 */
export async function generateSingleAISlug(
  ai: Ai,
  destinationUrl: string,
  maxLength = 10
): Promise<string> {
  const suggestions = await generateAISlugs(ai, destinationUrl, {
    count: 1,
    maxLength,
    style: "memorable",
  });
  return suggestions[0] ?? generateSlug(7);
}

/**
 * Quick slug suggestions without AI (for instant feedback)
 * Uses URL context to generate deterministic suggestions
 */
export function generateQuickSuggestions(destinationUrl: string, count = 3): string[] {
  const context = extractUrlContext(destinationUrl);
  const suggestions: string[] = [];

  // Use first meaningful keyword
  if (context.keywords.length > 0) {
    const keyword = context.keywords[0].toLowerCase().slice(0, 8);
    suggestions.push(keyword);

    // Add keyword with random suffix
    suggestions.push(`${keyword.slice(0, 5)}-${generateSlug(3)}`);
  }

  // Use domain abbreviation
  if (context.domain) {
    const abbrev = context.domain.split(".").slice(0, -1).join("").slice(0, 4);
    if (abbrev.length >= 2) {
      suggestions.push(`${abbrev}-${generateSlug(3)}`);
    }
  }

  // Fill remaining with random slugs
  while (suggestions.length < count) {
    suggestions.push(generateSlug(7));
  }

  return suggestions
    .map((s) => sanitizeSlug(s))
    .filter((s) => s.length >= 2 && !isReservedSlug(s))
    .slice(0, count);
}

// -----------------------------------------------------------------------------
// AI-Powered Link Preview Generation
// -----------------------------------------------------------------------------

export interface LinkPreview {
  title: string;
  description: string;
  suggestedImage?: string;
}

/**
 * Fetch and parse basic metadata from a URL
 */
async function fetchUrlMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  content?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Go2Bot/1.0 (Link Preview Generator)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {};
    }

    const html = await response.text();

    // Extract basic meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogDescMatch =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    // Extract main text content (simplified)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = "";
    if (bodyMatch) {
      content = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);
    }

    return {
      title: ogTitleMatch?.[1] || titleMatch?.[1],
      description: ogDescMatch?.[1] || descMatch?.[1],
      image: ogImageMatch?.[1],
      content,
    };
  } catch (error) {
    console.error("Failed to fetch URL metadata:", error);
    return {};
  }
}

/**
 * Generate AI-powered link preview (title, description)
 */
export async function generateAILinkPreview(ai: Ai, destinationUrl: string): Promise<LinkPreview> {
  // First, try to fetch existing metadata
  const metadata = await fetchUrlMetadata(destinationUrl);
  const context = extractUrlContext(destinationUrl);

  // If we already have good metadata, enhance it with AI
  const hasExistingMeta = metadata.title && metadata.description;

  const prompt = hasExistingMeta
    ? `Improve these link preview texts for a URL shortener. Make them more engaging and click-worthy while staying accurate.

Current title: ${metadata.title}
Current description: ${metadata.description?.slice(0, 300)}
URL: ${destinationUrl}

Requirements:
- Title: max 60 characters, compelling and clear
- Description: max 155 characters, explains value proposition
- Keep the core meaning but make it more engaging

Return ONLY in this exact format:
TITLE: Your improved title here
DESCRIPTION: Your improved description here`
    : `Generate a compelling link preview for this URL.

URL: ${destinationUrl}
Domain: ${context.domain}
Keywords from URL: ${context.keywords.join(", ") || "none"}
${metadata.content ? `Page content snippet: ${metadata.content.slice(0, 500)}` : ""}

Requirements:
- Title: max 60 characters, compelling and clear
- Description: max 155 characters, explains what the page offers

Return ONLY in this exact format:
TITLE: Your title here
DESCRIPTION: Your description here`;

  try {
    const response = await (ai as { run: (model: string, input: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 200,
      }
    );

    const text =
      typeof response === "string"
        ? response
        : ((response as { response?: string }).response ?? "");

    // Parse the response
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const descMatch = text.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);

    const title =
      titleMatch?.[1]?.trim().slice(0, 60) || metadata.title || context.domain || "Link";

    const description =
      descMatch?.[1]?.trim().slice(0, 155) ||
      metadata.description?.slice(0, 155) ||
      `Visit ${context.domain}`;

    return {
      title,
      description,
      suggestedImage: metadata.image,
    };
  } catch (error) {
    console.error("AI preview generation failed:", error);

    // Fallback to fetched metadata or defaults
    return {
      title: metadata.title || context.domain || "Link",
      description: metadata.description?.slice(0, 155) || `Visit ${context.domain}`,
      suggestedImage: metadata.image,
    };
  }
}

/**
 * Generate AI scheduling recommendations based on click data
 */
export async function generateSchedulingRecommendation(
  ai: Ai,
  clickData: Array<{
    hour: number;
    dayOfWeek: number;
    count: number;
  }>
): Promise<{
  bestTimes: Array<{ day: string; hour: string; score: number }>;
  summary: string;
}> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Find top performing time slots
  const sorted = [...clickData].sort((a, b) => b.count - a.count).slice(0, 10);

  const topSlots = sorted.map((slot) => ({
    day: dayNames[slot.dayOfWeek],
    hour: `${slot.hour}:00`,
    score: slot.count,
  }));

  // Use AI to generate a summary
  const dataStr = sorted
    .map((s) => `${dayNames[s.dayOfWeek]} ${s.hour}:00 - ${s.count} clicks`)
    .join("\n");

  const prompt = `Analyze this click data and provide a brief recommendation for the best times to share links.

Top performing time slots:
${dataStr}

Provide a 1-2 sentence summary of when to post for maximum engagement. Be specific about days and times.`;

  try {
    const response = await (ai as { run: (model: string, input: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 100,
      }
    );

    const summary =
      typeof response === "string"
        ? response.trim()
        : ((response as { response?: string }).response?.trim() ??
          `Best times to post: ${topSlots[0]?.day} at ${topSlots[0]?.hour}`);

    return {
      bestTimes: topSlots.slice(0, 5),
      summary,
    };
  } catch (error) {
    console.error("AI scheduling recommendation failed:", error);
    return {
      bestTimes: topSlots.slice(0, 5),
      summary:
        topSlots.length > 0
          ? `Based on your data, ${topSlots[0].day} at ${topSlots[0].hour} typically gets the most engagement.`
          : "Not enough data to make recommendations yet.",
    };
  }
}

// -----------------------------------------------------------------------------
// AI-Powered Link Previews
// -----------------------------------------------------------------------------

export interface LinkPreview {
  title: string;
  description: string;
  suggestedImage?: string;
}

/**
 * Generate AI-powered OG metadata for a link
 */
export async function generateLinkPreview(
  ai: Ai,
  destinationUrl: string,
  pageContent?: string
): Promise<LinkPreview> {
  const context = extractUrlContext(destinationUrl);

  const prompt = `Generate SEO-optimized Open Graph metadata for this URL: ${destinationUrl}

Context:
- Domain: ${context.domain}
- Keywords: ${context.keywords.join(", ") || "none"}
${pageContent ? `- Page content snippet: ${pageContent.slice(0, 500)}` : ""}

Generate:
1. A compelling title (max 60 chars) that encourages clicks
2. A description (max 160 chars) that summarizes the content

Format your response exactly like this:
TITLE: [your title here]
DESCRIPTION: [your description here]`;

  try {
    const response = await (ai as { run: (model: string, input: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 200,
      }
    );

    const text =
      typeof response === "string"
        ? response
        : ((response as { response?: string }).response ?? "");

    // Parse response
    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const descMatch = text.match(/DESCRIPTION:\s*(.+)/i);

    return {
      title: titleMatch?.[1]?.trim().slice(0, 60) ?? context.domain,
      description: descMatch?.[1]?.trim().slice(0, 160) ?? `Visit ${context.domain}`,
    };
  } catch (error) {
    console.error("AI preview generation failed:", error);
    return {
      title: context.domain || "Link",
      description: `Check out this link to ${context.domain}`,
    };
  }
}

// -----------------------------------------------------------------------------
// AI Scheduling Recommendations
// -----------------------------------------------------------------------------

export interface SchedulingRecommendation {
  bestDays: string[];
  bestHours: number[];
  timezone: string;
  confidence: number;
  reasoning: string;
}

/**
 * Analyze click patterns and recommend optimal posting times
 */
export function analyzeClickPatterns(
  clicks: Array<{
    timestamp: string;
    country?: string;
  }>
): SchedulingRecommendation {
  if (clicks.length < 10) {
    // Not enough data - return general recommendations
    return {
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      bestHours: [10, 14, 20],
      timezone: "UTC",
      confidence: 0.3,
      reasoning:
        "Not enough click data for personalized recommendations. Using general best practices.",
    };
  }

  // Count clicks by day of week
  const dayCount: Record<number, number> = {};
  const hourCount: Record<number, number> = {};

  for (const click of clicks) {
    const date = new Date(click.timestamp);
    const day = date.getUTCDay();
    const hour = date.getUTCHours();

    dayCount[day] = (dayCount[day] ?? 0) + 1;
    hourCount[hour] = (hourCount[hour] ?? 0) + 1;
  }

  // Find top 3 days
  const sortedDays = Object.entries(dayCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[parseInt(day)];
    });

  // Find top 3 hours
  const sortedHours = Object.entries(hourCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Calculate confidence based on data volume and consistency
  const maxClicks = Math.max(...Object.values(dayCount));
  const minClicks = Math.min(...Object.values(dayCount));
  const variance = (maxClicks - minClicks) / maxClicks;
  const confidence = Math.min(0.9, 0.3 + (clicks.length / 100) * 0.3 + variance * 0.3);

  return {
    bestDays: sortedDays,
    bestHours: sortedHours,
    timezone: "UTC",
    confidence,
    reasoning: `Based on analysis of ${clicks.length} clicks. Your audience is most active on ${sortedDays[0]} around ${sortedHours[0]}:00 UTC.`,
  };
}

/**
 * Generate AI-powered content suggestions based on analytics
 */
export async function generateContentSuggestions(
  ai: Ai,
  topLinks: Array<{ url: string; clicks: number; title?: string }>,
  lowLinks: Array<{ url: string; clicks: number; title?: string }>
): Promise<string[]> {
  if (topLinks.length === 0) {
    return ["Create your first link to start getting insights!"];
  }

  const prompt = `Analyze these link performance patterns and provide actionable suggestions:

Top Performing Links:
${topLinks.map((l) => `- ${l.title ?? l.url}: ${l.clicks} clicks`).join("\n")}

Low Performing Links:
${lowLinks.map((l) => `- ${l.title ?? l.url}: ${l.clicks} clicks`).join("\n")}

Provide 3 specific, actionable suggestions to improve link performance.
Format: One suggestion per line, be concise (max 100 chars each).`;

  try {
    const response = await (ai as { run: (model: string, input: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 300,
      }
    );

    const text =
      typeof response === "string"
        ? response
        : ((response as { response?: string }).response ?? "");

    return text
      .split("\n")
      .map((line) => line.replace(/^[\d\.\-\*]+\s*/, "").trim())
      .filter((line) => line.length > 10 && line.length < 150)
      .slice(0, 3);
  } catch (error) {
    console.error("AI content suggestions failed:", error);
    return [
      "Try shorter, more memorable slugs for better click-through",
      "Add compelling titles and descriptions to your links",
      "Share links during peak audience hours",
    ];
  }
}

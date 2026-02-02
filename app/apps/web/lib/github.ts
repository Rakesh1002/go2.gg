/**
 * GitHub API utilities for fetching releases
 */

import { siteConfig } from "@repo/config";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Array<{
    type: "feature" | "improvement" | "fix" | "breaking";
    text: string;
  }>;
  url: string;
}

/**
 * Parse GitHub release body into structured changes
 */
function parseReleaseBody(body: string): ChangelogEntry["changes"] {
  const changes: ChangelogEntry["changes"] = [];

  if (!body) return changes;

  const lines = body.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Remove markdown list markers
    const text = trimmed.replace(/^[-*]\s*/, "").trim();
    if (!text) continue;

    // Detect type from common patterns
    let type: ChangelogEntry["changes"][0]["type"] = "improvement";
    const lowerText = text.toLowerCase();

    if (
      lowerText.startsWith("feat:") ||
      lowerText.startsWith("feature:") ||
      lowerText.includes("new feature") ||
      lowerText.startsWith("add ") ||
      lowerText.startsWith("added ")
    ) {
      type = "feature";
    } else if (
      lowerText.startsWith("fix:") ||
      lowerText.startsWith("bug:") ||
      lowerText.startsWith("fixed ") ||
      lowerText.includes("bug fix")
    ) {
      type = "fix";
    } else if (lowerText.startsWith("breaking:") || lowerText.includes("breaking change")) {
      type = "breaking";
    }

    // Clean up the text (remove type prefixes)
    const cleanText = text
      .replace(/^(feat|feature|fix|bug|breaking|improvement|chore|docs|refactor):\s*/i, "")
      .replace(/^\*\*[^*]+\*\*:\s*/, "") // Remove bold prefixes like **Feature:**
      .trim();

    if (cleanText) {
      changes.push({ type, text: cleanText });
    }
  }

  return changes;
}

/**
 * Format date string to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Extract version from tag name
 */
function extractVersion(tagName: string): string {
  // Remove 'v' prefix if present
  return tagName.replace(/^v/, "");
}

/**
 * Fetch releases from GitHub API
 */
export async function fetchGitHubReleases(limit = 10): Promise<ChangelogEntry[]> {
  try {
    // Extract owner/repo from GitHub URL
    const githubUrl = siteConfig.links.github ?? "https://github.com/rakesh1002/go2.gg";
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

    if (!match) {
      console.error("Invalid GitHub URL in site config");
      return [];
    }

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${limit}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Go2-Web-App",
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      // If rate limited or repo not found, return empty
      console.error(`GitHub API error: ${response.status}`);
      return [];
    }

    const releases: GitHubRelease[] = await response.json();

    // Filter out drafts and prereleases, then map to changelog entries
    return releases
      .filter((release) => !release.draft && !release.prerelease)
      .map((release) => ({
        version: extractVersion(release.tag_name),
        date: formatDate(release.published_at),
        changes: parseReleaseBody(release.body),
        url: release.html_url,
      }))
      .filter((entry) => entry.changes.length > 0);
  } catch (error) {
    console.error("Failed to fetch GitHub releases:", error);
    return [];
  }
}

/**
 * Get fallback changelog entries when GitHub API fails
 */
export function getFallbackChangelog(): ChangelogEntry[] {
  return [
    {
      version: "2.0.0",
      date: "December 2025",
      changes: [
        { type: "feature", text: "Complete dashboard redesign" },
        { type: "feature", text: "Link-in-bio page builder" },
        { type: "feature", text: "Geo and device targeting" },
        { type: "improvement", text: "10x faster API response times" },
        { type: "improvement", text: "New TypeScript SDK" },
      ],
      url: siteConfig.links.github ?? "https://github.com/rakesh1002/go2.gg",
    },
  ];
}

/**
 * CSV Import/Export Library
 *
 * Handles CSV parsing and generation for bulk link operations.
 * Supports importing from competitors (Bitly, Rebrandly, Short.io, Dub.co).
 */

import type { Link } from "@repo/db";

/**
 * CSV column mapping for Go2 export format
 */
export const GO2_CSV_COLUMNS = [
  "id",
  "shortUrl",
  "destinationUrl",
  "slug",
  "domain",
  "title",
  "description",
  "tags",
  "hasPassword",
  "expiresAt",
  "clickLimit",
  "clickCount",
  "geoTargets",
  "deviceTargets",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "iosUrl",
  "androidUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "isArchived",
  "createdAt",
  "updatedAt",
  "lastClickedAt",
] as const;

/**
 * Supported import formats from competitors
 */
export type ImportFormat = "go2" | "bitly" | "rebrandly" | "short.io" | "dub" | "generic";

/**
 * Column mappings for competitor CSV formats
 */
const COMPETITOR_MAPPINGS: Record<ImportFormat, Record<string, keyof Link | null>> = {
  go2: {
    id: "id",
    shortUrl: null, // Derived
    destinationUrl: "destinationUrl",
    slug: "slug",
    domain: "domain",
    title: "title",
    description: "description",
    tags: "tags",
    hasPassword: null, // Not importable
    expiresAt: "expiresAt",
    clickLimit: "clickLimit",
    clickCount: "clickCount",
    geoTargets: "geoTargets",
    deviceTargets: "deviceTargets",
    utmSource: "utmSource",
    utmMedium: "utmMedium",
    utmCampaign: "utmCampaign",
    utmTerm: "utmTerm",
    utmContent: "utmContent",
    iosUrl: "iosUrl",
    androidUrl: "androidUrl",
    ogTitle: "ogTitle",
    ogDescription: "ogDescription",
    ogImage: "ogImage",
    isArchived: "isArchived",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    lastClickedAt: "lastClickedAt",
  },
  bitly: {
    link: null, // Short URL - extract slug
    long_url: "destinationUrl",
    title: "title",
    created_at: "createdAt",
    tags: "tags",
    clicks: "clickCount",
    custom_bitlink: "slug",
    domain: "domain",
  },
  rebrandly: {
    id: null,
    shortUrl: null, // Extract slug
    destination: "destinationUrl",
    slashtag: "slug",
    domain: "domain",
    title: "title",
    description: "description",
    clicks: "clickCount",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    tags: "tags",
  },
  "short.io": {
    originalURL: "destinationUrl",
    path: "slug",
    domain: "domain",
    title: "title",
    clicks: "clickCount",
    createdAt: "createdAt",
    tags: "tags",
    iosURL: "iosUrl",
    androidURL: "androidUrl",
    expiresAt: "expiresAt",
  },
  dub: {
    id: null,
    url: "destinationUrl",
    key: "slug",
    domain: "domain",
    title: "title",
    description: "description",
    clicks: "clickCount",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    tags: "tags",
    ios: "iosUrl",
    android: "androidUrl",
    geo: "geoTargets",
    expiresAt: "expiresAt",
  },
  generic: {
    url: "destinationUrl",
    destination: "destinationUrl",
    destination_url: "destinationUrl",
    long_url: "destinationUrl",
    original_url: "destinationUrl",
    target: "destinationUrl",
    slug: "slug",
    short: "slug",
    alias: "slug",
    key: "slug",
    path: "slug",
    title: "title",
    name: "title",
    description: "description",
    domain: "domain",
    tags: "tags",
    clicks: "clickCount",
    created: "createdAt",
    created_at: "createdAt",
    createdAt: "createdAt",
  },
};

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() ?? "";
    });
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Detect import format from CSV headers
 */
export function detectImportFormat(headers: string[]): ImportFormat {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  // Check for Go2 format
  if (headerSet.has("destinationurl") && headerSet.has("shorturl")) {
    return "go2";
  }

  // Check for Bitly format
  if (headerSet.has("long_url") || headerSet.has("custom_bitlink")) {
    return "bitly";
  }

  // Check for Rebrandly format
  if (headerSet.has("slashtag") || headerSet.has("destination")) {
    return "rebrandly";
  }

  // Check for Short.io format
  if (headerSet.has("originalurl") || headerSet.has("path")) {
    return "short.io";
  }

  // Check for Dub format
  if (headerSet.has("key") && (headerSet.has("url") || headerSet.has("clicks"))) {
    return "dub";
  }

  // Fall back to generic
  return "generic";
}

/**
 * Import link data from CSV row
 */
export interface ImportedLink {
  destinationUrl: string;
  slug?: string;
  domain?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expiresAt?: string;
  clickLimit?: number;
  geoTargets?: Record<string, string>;
  deviceTargets?: Record<string, string>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  iosUrl?: string;
  androidUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Transform CSV row to link data based on format
 */
export function transformRow(
  row: Record<string, string>,
  format: ImportFormat
): ImportedLink | null {
  const mapping = COMPETITOR_MAPPINGS[format];

  // Find destination URL (required)
  let destinationUrl = "";
  for (const [csvCol, linkField] of Object.entries(mapping)) {
    if (linkField === "destinationUrl" && row[csvCol]) {
      destinationUrl = row[csvCol];
      break;
    }
  }

  // Try generic fallbacks
  if (!destinationUrl) {
    destinationUrl =
      row.url ||
      row.destination ||
      row.destination_url ||
      row.long_url ||
      row.originalURL ||
      row.target ||
      "";
  }

  if (!destinationUrl || !isValidUrl(destinationUrl)) {
    return null;
  }

  // Build link object
  const link: ImportedLink = {
    destinationUrl,
  };

  // Find slug
  for (const [csvCol, linkField] of Object.entries(mapping)) {
    if (linkField === "slug" && row[csvCol]) {
      link.slug = sanitizeSlug(row[csvCol]);
      break;
    }
  }

  // Map other fields
  for (const [csvCol, linkField] of Object.entries(mapping)) {
    if (!linkField || linkField === "destinationUrl" || linkField === "slug") continue;

    const value = row[csvCol];
    if (!value) continue;

    switch (linkField) {
      case "domain":
        link.domain = value;
        break;
      case "title":
        link.title = value;
        break;
      case "description":
        link.description = value;
        break;
      case "tags":
        link.tags = parseTags(value);
        break;
      case "expiresAt":
        link.expiresAt = parseDate(value);
        break;
      case "utmSource":
        link.utmSource = value;
        break;
      case "utmMedium":
        link.utmMedium = value;
        break;
      case "utmCampaign":
        link.utmCampaign = value;
        break;
      case "utmTerm":
        link.utmTerm = value;
        break;
      case "utmContent":
        link.utmContent = value;
        break;
      case "iosUrl":
        if (isValidUrl(value)) link.iosUrl = value;
        break;
      case "androidUrl":
        if (isValidUrl(value)) link.androidUrl = value;
        break;
      case "ogTitle":
        link.ogTitle = value;
        break;
      case "ogDescription":
        link.ogDescription = value;
        break;
      case "ogImage":
        if (isValidUrl(value)) link.ogImage = value;
        break;
      case "geoTargets":
        try {
          link.geoTargets = JSON.parse(value);
        } catch {
          // Ignore invalid JSON
        }
        break;
      case "deviceTargets":
        try {
          link.deviceTargets = JSON.parse(value);
        } catch {
          // Ignore invalid JSON
        }
        break;
    }
  }

  return link;
}

/**
 * Generate CSV from links
 */
export function generateCSV(
  links: Array<{
    id: string;
    shortUrl: string;
    destinationUrl: string;
    slug: string;
    domain: string;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    hasPassword?: boolean;
    expiresAt?: string | null;
    clickLimit?: number | null;
    clickCount?: number;
    geoTargets?: Record<string, string> | null;
    deviceTargets?: Record<string, string> | null;
    utm?: {
      source?: string | null;
      medium?: string | null;
      campaign?: string | null;
      term?: string | null;
      content?: string | null;
    };
    deepLinks?: {
      ios?: string | null;
      android?: string | null;
    };
    og?: {
      title?: string | null;
      description?: string | null;
      image?: string | null;
    };
    isArchived?: boolean;
    createdAt: string;
    updatedAt: string;
    lastClickedAt?: string | null;
  }>
): string {
  const rows: string[] = [];

  // Header row
  rows.push(GO2_CSV_COLUMNS.join(","));

  // Data rows
  for (const link of links) {
    const row = [
      escapeCSV(link.id),
      escapeCSV(link.shortUrl),
      escapeCSV(link.destinationUrl),
      escapeCSV(link.slug),
      escapeCSV(link.domain),
      escapeCSV(link.title ?? ""),
      escapeCSV(link.description ?? ""),
      escapeCSV(JSON.stringify(link.tags ?? [])),
      escapeCSV(link.hasPassword ? "true" : "false"),
      escapeCSV(link.expiresAt ?? ""),
      escapeCSV(link.clickLimit?.toString() ?? ""),
      escapeCSV(link.clickCount?.toString() ?? "0"),
      escapeCSV(link.geoTargets ? JSON.stringify(link.geoTargets) : ""),
      escapeCSV(link.deviceTargets ? JSON.stringify(link.deviceTargets) : ""),
      escapeCSV(link.utm?.source ?? ""),
      escapeCSV(link.utm?.medium ?? ""),
      escapeCSV(link.utm?.campaign ?? ""),
      escapeCSV(link.utm?.term ?? ""),
      escapeCSV(link.utm?.content ?? ""),
      escapeCSV(link.deepLinks?.ios ?? ""),
      escapeCSV(link.deepLinks?.android ?? ""),
      escapeCSV(link.og?.title ?? ""),
      escapeCSV(link.og?.description ?? ""),
      escapeCSV(link.og?.image ?? ""),
      escapeCSV(link.isArchived ? "true" : "false"),
      escapeCSV(link.createdAt),
      escapeCSV(link.updatedAt),
      escapeCSV(link.lastClickedAt ?? ""),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Escape a value for CSV (handle commas and quotes)
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize slug for use in URLs
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

/**
 * Parse tags from various formats
 */
function parseTags(value: string): string[] {
  // Try JSON array first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => typeof t === "string");
    }
  } catch {
    // Not JSON
  }

  // Try comma-separated
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Parse date from various formats
 */
function parseDate(value: string): string | undefined {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Import result type
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
  links: ImportedLink[];
}

/**
 * Process CSV import
 */
export function processImport(csv: string, format?: ImportFormat): ImportResult {
  const rows = parseCSV(csv);

  if (rows.length === 0) {
    return {
      success: 0,
      failed: 0,
      errors: [{ row: 0, reason: "Empty or invalid CSV file" }],
      links: [],
    };
  }

  // Detect format from headers if not specified
  const headers = Object.keys(rows[0]);
  const detectedFormat = format ?? detectImportFormat(headers);

  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    links: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const link = transformRow(rows[i], detectedFormat);

    if (link) {
      result.success++;
      result.links.push(link);
    } else {
      result.failed++;
      result.errors.push({
        row: i + 2, // +2 for 1-indexed and header row
        reason: "Invalid or missing destination URL",
      });
    }
  }

  return result;
}

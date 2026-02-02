"use client";

import { useQuery } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ============================================================================
// Query Keys - Centralized for consistency
// ============================================================================

export const queryKeys = {
  // Stats
  stats: ["stats"] as const,
  dashboardStats: ["stats", "dashboard"] as const,
  linkStats: ["stats", "links"] as const,

  // Links
  links: (params?: LinkQueryParams) => ["links", params] as const,
  link: (id: string) => ["links", id] as const,
  linkAnalytics: (id: string) => ["links", id, "analytics"] as const,

  // Domains
  domains: ["domains"] as const,
  domain: (id: string) => ["domains", id] as const,

  // Usage
  usage: ["usage"] as const,

  // User/Organization
  organization: (id: string) => ["organization", id] as const,

  // Preferences
  preferences: ["preferences"] as const,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  customDomains: number;
  clicksToday: number;
  clicksTrend: number;
  subscription?: {
    plan: string;
    status: string;
    trialEndsAt?: string | null;
  };
}

export interface LinkStats {
  totalLinks: number;
  totalClicks: number;
  clicksToday: number;
  topCountry: string | null;
}

export interface Link {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  hasPassword: boolean;
  tags: string[];
}

export interface LinkQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  filters?: Record<string, string[]>;
}

export interface LinksResponse {
  success: boolean;
  data: Link[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
}

export interface Domain {
  id: string;
  domain: string;
  verificationStatus: "pending" | "verified" | "failed";
  verifiedAt?: string;
  dnsRecords: {
    verification: { type: string; name: string; value: string };
    cname: { type: string; name: string; value: string };
  };
  createdAt: string;
}

export interface UsageData {
  links: { current: number; limit: number | null; percentage: number | null };
  linksThisMonth: { current: number; limit: number | null; percentage: number | null };
  domains: { current: number; limit: number | null; percentage: number | null };
  teamMembers: { current: number; limit: number | null; percentage: number | null };
  plan: string;
}

export interface UserPreferences {
  userId: string;
  defaultDomainId: string | null;
  defaultTrackAnalytics: boolean;
  defaultPublicStats: boolean;
  defaultFolderId: string | null;
  emailNotificationsEnabled: boolean;
  emailUsageAlerts: boolean;
  emailWeeklyDigest: boolean;
  emailMarketing: boolean;
  theme: "light" | "dark" | "system";
  defaultTimeRange: "7d" | "30d" | "90d" | "all";
  itemsPerPage: number;
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/api/v1/stats/dashboard`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  const result = await response.json();
  return result.data;
}

async function fetchLinkStats(): Promise<LinkStats> {
  const response = await fetch(`${API_URL}/api/v1/stats/links`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch link stats");
  }

  const result = await response.json();
  return result.data;
}

async function fetchLinks(params?: LinkQueryParams): Promise<LinksResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.perPage) searchParams.set("perPage", String(params.perPage));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.sort) searchParams.set("sort", params.sort);

  const url = `${API_URL}/api/v1/links${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch links");
  }

  const result = await response.json();
  return {
    success: true,
    data: result.data || [],
    meta: result.meta || { page: 1, perPage: 20, total: 0, hasMore: false },
  };
}

async function fetchDomains(): Promise<Domain[]> {
  const response = await fetch(`${API_URL}/api/v1/domains`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch domains");
  }

  const result = await response.json();
  return result.data || [];
}

async function fetchUsage(): Promise<UsageData> {
  const response = await fetch(`${API_URL}/api/v1/usage`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch usage");
  }

  const result = await response.json();
  return result.data;
}

async function fetchPreferences(): Promise<UserPreferences> {
  const response = await fetch(`${API_URL}/api/v1/users/me/preferences`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch preferences");
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch dashboard statistics
 * Used on the main dashboard page
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch link-specific statistics
 * Used on the links page
 */
export function useLinkStats() {
  return useQuery({
    queryKey: queryKeys.linkStats,
    queryFn: fetchLinkStats,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch paginated links list
 * Used on the links page and recent activity
 */
export function useLinks(params?: LinkQueryParams) {
  return useQuery({
    queryKey: queryKeys.links(params),
    queryFn: () => fetchLinks(params),
    staleTime: 15_000, // 15 seconds - links change more frequently
  });
}

/**
 * Hook to fetch custom domains
 * Used on the domains page
 */
export function useDomains() {
  return useQuery({
    queryKey: queryKeys.domains,
    queryFn: fetchDomains,
    staleTime: 60_000, // 1 minute - domains change less frequently
  });
}

/**
 * Hook to fetch usage/limits data
 * Used in usage cards and subscription context
 */
export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage,
    queryFn: fetchUsage,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Hook to fetch user preferences
 * Used for link defaults, theme, and notification settings
 */
export function usePreferences() {
  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: fetchPreferences,
    staleTime: 300_000, // 5 minutes - preferences change infrequently
  });
}

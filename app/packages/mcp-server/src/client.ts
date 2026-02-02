/**
 * Go2 API Client
 *
 * Simple HTTP client for the Go2 API.
 */

export interface Go2ClientOptions {
  apiKey: string;
  apiUrl?: string;
}

export interface Link {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title: string | null;
  description: string | null;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkAnalytics {
  totalClicks: number;
  lastClickedAt: string | null;
  byCountry: Array<{ country: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  byBrowser: Array<{ browser: string; count: number }>;
  byReferrer: Array<{ referrer: string; count: number }>;
  overTime: Array<{ date: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
}

export class Go2Client {
  private apiKey: string;
  private apiUrl: string;

  constructor(options: Go2ClientOptions) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl ?? "https://api.go2.gg";
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.apiUrl}/api/v1${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? `API error: ${response.status}`);
    }

    return result.data as T;
  }

  /**
   * Create a new short link
   */
  async createLink(input: {
    destinationUrl: string;
    slug?: string;
    title?: string;
    description?: string;
    tags?: string[];
    expiresAt?: string;
    password?: string;
  }): Promise<Link> {
    return this.request<Link>("POST", "/links", input);
  }

  /**
   * List links with pagination
   */
  async listLinks(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    domain?: string;
    tag?: string;
    archived?: boolean;
    sort?: "created" | "clicks" | "updated";
  }): Promise<PaginatedResponse<Link>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.search) query.set("search", params.search);
    if (params?.domain) query.set("domain", params.domain);
    if (params?.tag) query.set("tag", params.tag);
    if (params?.archived !== undefined) query.set("archived", String(params.archived));
    if (params?.sort) query.set("sort", params.sort);

    const queryString = query.toString();
    const path = queryString ? `/links?${queryString}` : "/links";

    const response = await fetch(`${this.apiUrl}/api/v1${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? `API error: ${response.status}`);
    }

    return {
      data: result.data as Link[],
      meta: result.meta,
    };
  }

  /**
   * Get a single link by ID
   */
  async getLink(id: string): Promise<Link> {
    return this.request<Link>("GET", `/links/${id}`);
  }

  /**
   * Update a link
   */
  async updateLink(
    id: string,
    input: {
      destinationUrl?: string;
      slug?: string;
      title?: string;
      description?: string;
      tags?: string[];
      expiresAt?: string;
      password?: string;
      isArchived?: boolean;
    }
  ): Promise<Link> {
    return this.request<Link>("PATCH", `/links/${id}`, input);
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<void> {
    await this.request("DELETE", `/links/${id}`);
  }

  /**
   * Get link analytics
   */
  async getAnalytics(id: string, period?: string): Promise<LinkAnalytics> {
    const query = period ? `?period=${period}` : "";
    return this.request<LinkAnalytics>("GET", `/links/${id}/stats${query}`);
  }

  /**
   * Create multiple links at once
   */
  async bulkCreateLinks(
    links: Array<{
      destinationUrl: string;
      slug?: string;
      title?: string;
    }>
  ): Promise<Link[]> {
    const results: Link[] = [];

    for (const link of links) {
      try {
        const created = await this.createLink(link);
        results.push(created);
      } catch (error) {
        // Continue with other links even if one fails
        console.error(`Failed to create link for ${link.destinationUrl}:`, error);
      }
    }

    return results;
  }
}

/**
 * Links Resource
 */

import type { Go2 } from "../client";
import type { Link, CreateLinkInput, UpdateLinkInput, LinkStats, PaginationParams } from "../types";

export class LinksResource {
  constructor(private readonly client: Go2) {}

  /**
   * List all links
   */
  async list(params?: PaginationParams & { search?: string; tags?: string[] }) {
    return this.client.requestPaginated<Link>("/links", {
      page: params?.page,
      perPage: params?.perPage,
      search: params?.search,
      tags: params?.tags?.join(","),
    });
  }

  /**
   * Create a new short link
   */
  async create(input: CreateLinkInput): Promise<Link> {
    return this.client.request<Link>("POST", "/links", { body: input });
  }

  /**
   * Get a link by ID
   */
  async get(id: string): Promise<Link> {
    return this.client.request<Link>("GET", `/links/${id}`);
  }

  /**
   * Update a link
   */
  async update(id: string, input: UpdateLinkInput): Promise<Link> {
    return this.client.request<Link>("PATCH", `/links/${id}`, { body: input });
  }

  /**
   * Delete (archive) a link
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>("DELETE", `/links/${id}`);
  }

  /**
   * Get link analytics
   */
  async stats(
    id: string,
    options?: { period?: "24h" | "7d" | "30d" | "90d" | "all" }
  ): Promise<LinkStats> {
    return this.client.request<LinkStats>("GET", `/links/${id}/stats`, {
      query: { period: options?.period },
    });
  }

  /**
   * Bulk create links
   */
  async bulkCreate(links: CreateLinkInput[]): Promise<Link[]> {
    return this.client.request<Link[]>("POST", "/links/bulk", { body: { links } });
  }

  /**
   * Archive multiple links
   */
  async bulkArchive(ids: string[]): Promise<void> {
    return this.client.request<void>("POST", "/links/bulk-archive", { body: { ids } });
  }
}

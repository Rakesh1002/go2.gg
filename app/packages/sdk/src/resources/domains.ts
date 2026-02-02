/**
 * Domains Resource
 */

import type { Go2 } from "../client";
import type { Domain, CreateDomainInput, PaginationParams } from "../types";

export class DomainsResource {
  constructor(private readonly client: Go2) {}

  /**
   * List all custom domains
   */
  async list(params?: PaginationParams) {
    return this.client.requestPaginated<Domain>("/domains", {
      page: params?.page,
      perPage: params?.perPage,
    });
  }

  /**
   * Add a new custom domain
   */
  async create(input: CreateDomainInput): Promise<Domain> {
    return this.client.request<Domain>("POST", "/domains", { body: input });
  }

  /**
   * Get a domain by ID
   */
  async get(id: string): Promise<Domain> {
    return this.client.request<Domain>("GET", `/domains/${id}`);
  }

  /**
   * Delete a domain
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>("DELETE", `/domains/${id}`);
  }

  /**
   * Verify domain ownership
   */
  async verify(id: string): Promise<Domain> {
    return this.client.request<Domain>("POST", `/domains/${id}/verify`);
  }

  /**
   * Get DNS records needed for verification
   */
  async getDnsRecords(id: string): Promise<
    {
      type: string;
      name: string;
      value: string;
      ttl: number;
    }[]
  > {
    return this.client.request("GET", `/domains/${id}/dns`);
  }
}

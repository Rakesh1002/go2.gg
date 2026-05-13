/**
 * Webhooks Resource
 */

import type { Go2 } from "../client";
import type { Webhook, CreateWebhookInput, UpdateWebhookInput, PaginationParams } from "../types";

export interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  duration: number | null;
  success: boolean;
  attempts: number;
  createdAt: string;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  duration?: number;
}

export class WebhooksResource {
  constructor(private readonly client: Go2) {}

  /**
   * List all webhooks
   */
  async list(params?: PaginationParams) {
    return this.client.requestPaginated<Webhook>("/webhooks", {
      page: params?.page,
      perPage: params?.perPage,
    });
  }

  /**
   * Create a new webhook
   * @returns Webhook with secret (only shown once!)
   */
  async create(input: CreateWebhookInput): Promise<Webhook & { secret: string }> {
    return this.client.request<Webhook & { secret: string }>("POST", "/webhooks", {
      body: input,
    });
  }

  /**
   * Get a webhook by ID
   */
  async get(id: string): Promise<Webhook> {
    return this.client.request<Webhook>("GET", `/webhooks/${id}`);
  }

  /**
   * Update a webhook
   */
  async update(id: string, input: UpdateWebhookInput): Promise<Webhook> {
    return this.client.request<Webhook>("PATCH", `/webhooks/${id}`, { body: input });
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>("DELETE", `/webhooks/${id}`);
  }

  /**
   * Send a test event to the webhook
   */
  async test(id: string): Promise<WebhookTestResult> {
    return this.client.request<WebhookTestResult>("POST", `/webhooks/${id}/test`);
  }

  /**
   * Get recent delivery history
   */
  async deliveries(id: string): Promise<WebhookDelivery[]> {
    return this.client.request<WebhookDelivery[]>("GET", `/webhooks/${id}/deliveries`);
  }

  /**
   * Rotate the signing secret
   * @returns New secret (only shown once!)
   */
  async rotateSecret(id: string): Promise<{ secret: string }> {
    return this.client.request<{ secret: string }>("POST", `/webhooks/${id}/rotate-secret`);
  }
}

/**
 * Go2 SDK Client
 *
 * Main client for interacting with the Go2 API.
 */

import { Go2Error } from "./error.js";
import type {
  Go2Options,
  Link,
  LinkCreateInput,
  LinkUpdateInput,
  LinkListParams,
  LinkStats,
  QRCode,
  QRGenerateInput,
  QRCreateInput,
  QRUpdateInput,
  Domain,
  DomainCreateInput,
  Webhook,
  WebhookCreateInput,
  WebhookUpdateInput,
  WebhookDelivery,
  Gallery,
  GalleryItem,
  PaginatedResponse,
} from "./types.js";

export class Go2 {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  public readonly links: LinksAPI;
  public readonly qr: QRAPI;
  public readonly domains: DomainsAPI;
  public readonly webhooks: WebhooksAPI;
  public readonly galleries: GalleriesAPI;

  constructor(options: Go2Options) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl ?? "https://api.go2.gg";

    // Initialize API namespaces
    this.links = new LinksAPI(this);
    this.qr = new QRAPI(this);
    this.domains = new DomainsAPI(this);
    this.webhooks = new WebhooksAPI(this);
    this.galleries = new GalleriesAPI(this);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
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
      throw new Go2Error(
        result.error?.message ?? "API request failed",
        response.status,
        result.error?.code ?? "UNKNOWN_ERROR"
      );
    }

    return result.data as T;
  }

  async requestPaginated<T>(
    path: string,
    params?: Record<string, unknown>
  ): Promise<PaginatedResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }
    }

    const queryString = searchParams.toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    const response = await fetch(`${this.apiUrl}/api/v1${fullPath}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Go2Error(
        result.error?.message ?? "API request failed",
        response.status,
        result.error?.code ?? "UNKNOWN_ERROR"
      );
    }

    return {
      data: result.data as T[],
      meta: result.meta,
    };
  }
}

class LinksAPI {
  constructor(private client: Go2) {}

  async create(input: LinkCreateInput): Promise<Link> {
    return this.client.request<Link>("POST", "/links", input);
  }

  async list(params?: LinkListParams): Promise<PaginatedResponse<Link>> {
    return this.client.requestPaginated<Link>("/links", params);
  }

  async get(id: string): Promise<Link> {
    return this.client.request<Link>("GET", `/links/${id}`);
  }

  async update(id: string, input: LinkUpdateInput): Promise<Link> {
    return this.client.request<Link>("PATCH", `/links/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await this.client.request("DELETE", `/links/${id}`);
  }

  async stats(id: string): Promise<LinkStats> {
    return this.client.request<LinkStats>("GET", `/links/${id}/stats`);
  }
}

class QRAPI {
  constructor(private client: Go2) {}

  async generate(input: QRGenerateInput): Promise<{ url: string; downloadUrl: string }> {
    return this.client.request("POST", "/qr/generate", input);
  }

  async create(input: QRCreateInput): Promise<QRCode> {
    return this.client.request<QRCode>("POST", "/qr", input);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<QRCode>> {
    return this.client.requestPaginated<QRCode>("/qr", params);
  }

  async get(id: string): Promise<QRCode> {
    return this.client.request<QRCode>("GET", `/qr/${id}`);
  }

  async update(id: string, input: QRUpdateInput): Promise<QRCode> {
    return this.client.request<QRCode>("PATCH", `/qr/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await this.client.request("DELETE", `/qr/${id}`);
  }
}

class DomainsAPI {
  constructor(private client: Go2) {}

  async create(input: DomainCreateInput): Promise<Domain> {
    return this.client.request<Domain>("POST", "/domains", input);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Domain>> {
    return this.client.requestPaginated<Domain>("/domains", params);
  }

  async get(id: string): Promise<Domain> {
    return this.client.request<Domain>("GET", `/domains/${id}`);
  }

  async verify(id: string): Promise<Domain> {
    return this.client.request<Domain>("POST", `/domains/${id}/verify`);
  }

  async delete(id: string): Promise<void> {
    await this.client.request("DELETE", `/domains/${id}`);
  }
}

class WebhooksAPI {
  constructor(private client: Go2) {}

  async create(input: WebhookCreateInput): Promise<Webhook> {
    return this.client.request<Webhook>("POST", "/webhooks", input);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Webhook>> {
    return this.client.requestPaginated<Webhook>("/webhooks", params);
  }

  async get(id: string): Promise<Webhook> {
    return this.client.request<Webhook>("GET", `/webhooks/${id}`);
  }

  async update(id: string, input: WebhookUpdateInput): Promise<Webhook> {
    return this.client.request<Webhook>("PATCH", `/webhooks/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await this.client.request("DELETE", `/webhooks/${id}`);
  }

  async test(id: string): Promise<{ success: boolean; statusCode?: number; response?: string }> {
    return this.client.request("POST", `/webhooks/${id}/test`);
  }

  async deliveries(id: string): Promise<WebhookDelivery[]> {
    return this.client.request<WebhookDelivery[]>("GET", `/webhooks/${id}/deliveries`);
  }

  async rotateSecret(id: string): Promise<{ secret: string }> {
    return this.client.request("POST", `/webhooks/${id}/rotate-secret`);
  }
}

class GalleriesAPI {
  constructor(private client: Go2) {}

  async create(input: {
    slug: string;
    domain?: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    theme?: string;
    isPublished?: boolean;
  }): Promise<Gallery> {
    return this.client.request<Gallery>("POST", "/galleries", input);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Gallery>> {
    return this.client.requestPaginated<Gallery>("/galleries", params);
  }

  async get(id: string): Promise<Gallery> {
    return this.client.request<Gallery>("GET", `/galleries/${id}`);
  }

  async update(
    id: string,
    input: Partial<{
      slug: string;
      title: string;
      bio: string;
      avatarUrl: string;
      theme: string;
      isPublished: boolean;
    }>
  ): Promise<Gallery> {
    return this.client.request<Gallery>("PATCH", `/galleries/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await this.client.request("DELETE", `/galleries/${id}`);
  }

  async addItem(
    galleryId: string,
    input: {
      type: "link" | "header" | "divider" | "embed" | "image";
      title?: string;
      url?: string;
      thumbnailUrl?: string;
      iconName?: string;
      isVisible?: boolean;
    }
  ): Promise<GalleryItem> {
    return this.client.request<GalleryItem>("POST", `/galleries/${galleryId}/items`, input);
  }

  async updateItem(
    galleryId: string,
    itemId: string,
    input: Partial<{
      title: string;
      url: string;
      thumbnailUrl: string;
      iconName: string;
      isVisible: boolean;
    }>
  ): Promise<GalleryItem> {
    return this.client.request<GalleryItem>(
      "PATCH",
      `/galleries/${galleryId}/items/${itemId}`,
      input
    );
  }

  async deleteItem(galleryId: string, itemId: string): Promise<void> {
    await this.client.request("DELETE", `/galleries/${galleryId}/items/${itemId}`);
  }

  async reorderItems(
    galleryId: string,
    items: Array<{ id: string; position: number }>
  ): Promise<GalleryItem[]> {
    return this.client.request<GalleryItem[]>("PATCH", `/galleries/${galleryId}/items/reorder`, {
      items,
    });
  }
}

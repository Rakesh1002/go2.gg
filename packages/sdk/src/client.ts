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
  AgentAttributionClick,
  AgentAttributionListParams,
  AgentAttributionSummaryParams,
  AgentAttributionSummaryRow,
  AgentRun,
  Conversion,
  ConversionGoal,
  ConversionGoalCreateInput,
  ConversionTrackInput,
  ConversionTrackResult,
  RecentClick,
  AnalyticsOverview,
  AnalyticsClicksOverTime,
} from "./types.js";

export class Go2 {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  public readonly links: LinksAPI;
  public readonly qr: QRAPI;
  public readonly domains: DomainsAPI;
  public readonly webhooks: WebhooksAPI;
  public readonly galleries: GalleriesAPI;
  public readonly agentAttribution: AgentAttributionAPI;
  public readonly conversions: ConversionsAPI;
  public readonly analytics: AnalyticsAPI;

  constructor(options: Go2Options) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl ?? "https://api.go2.gg";

    // Initialize API namespaces
    this.links = new LinksAPI(this);
    this.qr = new QRAPI(this);
    this.domains = new DomainsAPI(this);
    this.webhooks = new WebhooksAPI(this);
    this.galleries = new GalleriesAPI(this);
    this.agentAttribution = new AgentAttributionAPI(this);
    this.conversions = new ConversionsAPI(this);
    this.analytics = new AnalyticsAPI(this);
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

/**
 * Agent attribution — query the click stream by agent_id, agent_run_id, or link_id.
 *
 * Every Go2 link can be stamped with `(agent_id, run_id, actor_id, tool_call_id)`
 * at create time (via `links.create({ agentId, agentRunId, ... })`) or at click time
 * (via `?ag=&ar=&at=&au=` query keys). This namespace lets you query that data back.
 *
 * @example
 * ```typescript
 * // Pull the click stream for a single agent run.
 * const clicks = await go2.agentAttribution.list({ agentRunId: "run_2026_04_27_a1b2" });
 *
 * // Roll up clicks per agent_run_id.
 * const summary = await go2.agentAttribution.summary({ groupBy: "agent_run_id" });
 *
 * // Enumerate every distinct (agent_id, agent_run_id) pair with click counts.
 * const runs = await go2.agentAttribution.runs();
 * ```
 */
class AgentAttributionAPI {
  constructor(private client: Go2) {}

  /** Click stream filtered by agent_id, agent_run_id, agent_actor_id, or link_id. */
  async list(params?: AgentAttributionListParams): Promise<PaginatedResponse<AgentAttributionClick>> {
    return this.client.requestPaginated<AgentAttributionClick>("/agent-attribution", params);
  }

  /** Roll-up grouped by agent_id or agent_run_id. */
  async summary(
    params?: AgentAttributionSummaryParams
  ): Promise<AgentAttributionSummaryRow[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    const path = qs ? `/agent-attribution/summary?${qs}` : "/agent-attribution/summary";
    return this.client.request<AgentAttributionSummaryRow[]>("GET", path);
  }

  /** Distinct (agent_id, agent_run_id) pairs with click counts and timestamps. */
  async runs(): Promise<AgentRun[]> {
    return this.client.request<AgentRun[]>("GET", "/agent-attribution/runs");
  }
}

/**
 * Conversions — record and query attributed conversion events.
 *
 * @example
 * ```typescript
 * // Track a sale from your server when a customer completes checkout.
 * await go2.conversions.track({
 *   trackingId: req.cookies.go2_ref,
 *   type: "purchase",
 *   value: 4900, // cents
 *   currency: "usd",
 *   externalId: stripeChargeId, // dedup key
 *   customerId: stripeCustomerId,
 * });
 * ```
 */
class ConversionsAPI {
  constructor(private client: Go2) {}

  /** Server-side conversion track. Idempotent on `(linkId, goalId, externalId)`. */
  async track(input: ConversionTrackInput): Promise<ConversionTrackResult> {
    return this.client.request<ConversionTrackResult>(
      "POST",
      "/conversions/track",
      input,
    );
  }

  /** List conversion goals configured for the workspace. */
  async listGoals(): Promise<ConversionGoal[]> {
    return this.client.request<ConversionGoal[]>("GET", "/conversions/goals");
  }

  /** Create a new conversion goal. */
  async createGoal(input: ConversionGoalCreateInput): Promise<ConversionGoal> {
    return this.client.request<ConversionGoal>("POST", "/conversions/goals", input);
  }

  /** Aggregated stats for the period. */
  async stats(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    goalId?: string;
  }): Promise<{ total: number; byGoal: Array<{ goalId: string; count: number; revenue: number }> }> {
    const qs = new URLSearchParams();
    if (params)
      for (const [k, v] of Object.entries(params))
        if (v !== undefined) qs.set(k, String(v));
    const path = qs.toString() ? `/conversions/stats?${qs}` : "/conversions/stats";
    return this.client.request("GET", path);
  }

  /** Per-link conversion drilldown. */
  async byLink(linkId: string): Promise<Conversion[]> {
    return this.client.request<Conversion[]>("GET", `/conversions/link/${linkId}`);
  }
}

/**
 * Analytics — read-side queries for clicks, geo, devices, referrers.
 *
 * @example
 * ```typescript
 * const overview = await go2.analytics.overview({ period: "30d" });
 * const live = await go2.analytics.recent({ limit: 20 });
 * ```
 */
class AnalyticsAPI {
  constructor(private client: Go2) {}

  async overview(params?: { period?: "7d" | "30d" | "90d" }): Promise<AnalyticsOverview> {
    const qs = params?.period ? `?period=${params.period}` : "";
    return this.client.request<AnalyticsOverview>("GET", `/analytics/overview${qs}`);
  }

  async clicksOverTime(params?: {
    period?: "7d" | "30d" | "90d";
    compare?: boolean;
  }): Promise<AnalyticsClicksOverTime> {
    const qs = new URLSearchParams();
    if (params?.period) qs.set("period", params.period);
    if (params?.compare) qs.set("compare", "previous");
    const tail = qs.toString() ? `?${qs}` : "";
    return this.client.request<AnalyticsClicksOverTime>("GET", `/analytics/clicks${tail}`);
  }

  /**
   * Recent clicks. Use `since` for incremental polling — supply the most
   * recent timestamp you've already seen and the API only returns newer rows.
   */
  async recent(params?: { since?: string; limit?: number }): Promise<RecentClick[]> {
    const qs = new URLSearchParams();
    if (params?.since) qs.set("since", params.since);
    if (params?.limit) qs.set("limit", String(params.limit));
    const tail = qs.toString() ? `?${qs}` : "";
    return this.client.request<RecentClick[]>("GET", `/analytics/recent${tail}`);
  }
}

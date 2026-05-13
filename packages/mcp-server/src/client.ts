/**
 * Go2 API Client
 *
 * Simple HTTP client for the Go2 API.
 */

export interface Go2ClientOptions {
  apiKey: string;
  apiUrl?: string;
  /**
   * Ambient agent context — auto-attached to every tool call that creates or
   * queries a link. Caller can override per-call. Typically populated from
   * env vars (GO2_AGENT_ID, GO2_AGENT_RUN_ID, GO2_AGENT_ACTOR_ID).
   */
  agentContext?: AgentContext;
}

export interface AgentContext {
  agentId?: string;
  agentRunId?: string;
  agentActorId?: string;
  agentToolCallId?: string;
  agentMetadata?: Record<string, unknown>;
}

export interface AttributionRow {
  id: string;
  linkId: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  isBot: boolean;
  isUnique: boolean;
  agentId: string | null;
  agentRunId: string | null;
  agentActorId: string | null;
  agentToolCallId: string | null;
  timestamp: string;
}

export interface RunSummary {
  agentId: string | null;
  agentRunId: string | null;
  clicks: number;
  firstClickAt: string;
  lastClickAt: string;
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
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  parentId: string | null;
  linkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderAnalytics {
  folder: { id: string; name: string; color: string; linkCount: number };
  totalClicks: number;
  uniqueVisitors: number;
  topCountry: string | null;
  topDevice: string | null;
  topLinks: Array<{
    id: string;
    slug: string | null;
    title: string | null;
    clicks: number;
  }>;
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

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export class Go2Client {
  private apiKey: string;
  private apiUrl: string;
  private agentContext: AgentContext;

  constructor(options: Go2ClientOptions) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl ?? "https://api.go2.gg";
    this.agentContext = options.agentContext ?? {};
  }

  getAgentContext(): AgentContext {
    return { ...this.agentContext };
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
   * Create a new short link. Per-call agent context overrides the ambient
   * context configured on the client.
   *
   * `agentToolCallId` is per-call (not per-link), so it isn't persisted on the
   * link record; instead we append it to the returned short URL as `?at=<id>`
   * so the redirect handler picks it up at click time via `extractAgentContext`.
   */
  async createLink(input: {
    destinationUrl: string;
    slug?: string;
    title?: string;
    description?: string;
    tags?: string[];
    expiresAt?: string;
    clickLimit?: number;
    password?: string;
    folderId?: string | null;
    agentId?: string;
    agentRunId?: string;
    agentActorId?: string;
    agentToolCallId?: string;
    agentMetadata?: Record<string, unknown>;
  }): Promise<Link> {
    const { agentToolCallId, ...rest } = input;
    const body = {
      ...rest,
      agentId: input.agentId ?? this.agentContext.agentId,
      agentRunId: input.agentRunId ?? this.agentContext.agentRunId,
      agentActorId: input.agentActorId ?? this.agentContext.agentActorId,
      agentMetadata: input.agentMetadata ?? this.agentContext.agentMetadata,
    };
    const link = await this.request<Link>("POST", "/links", body);
    const toolCallId = agentToolCallId ?? this.agentContext.agentToolCallId;
    if (toolCallId) {
      link.shortUrl = appendToolCallId(link.shortUrl, toolCallId);
    }
    return link;
  }

  /**
   * Create a single-use link (clickLimit = 1).
   */
  async createRevocableLink(input: {
    destinationUrl: string;
    title?: string;
    description?: string;
    slug?: string;
    agentId?: string;
    agentRunId?: string;
    agentActorId?: string;
    agentToolCallId?: string;
    agentMetadata?: Record<string, unknown>;
  }): Promise<Link> {
    return this.createLink({ ...input, clickLimit: 1 });
  }

  /**
   * Create a link that expires after `ttlMinutes` (default 60, max 30 days).
   */
  async createExpiringLink(input: {
    destinationUrl: string;
    ttlMinutes?: number;
    title?: string;
    description?: string;
    slug?: string;
    agentId?: string;
    agentRunId?: string;
    agentActorId?: string;
    agentToolCallId?: string;
    agentMetadata?: Record<string, unknown>;
  }): Promise<Link> {
    const ttl = clampInt(input.ttlMinutes ?? 60, 1, 43200);
    const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString();
    const { ttlMinutes, ...rest } = input;
    void ttlMinutes;
    return this.createLink({ ...rest, expiresAt });
  }

  /**
   * Archive every link tied to a given agent_run_id. Returns count archived.
   */
  async revokeRunLinks(params: { agentRunId?: string } = {}): Promise<{ archived: number; ids: string[] }> {
    const runId = params.agentRunId ?? this.agentContext.agentRunId;
    if (!runId) {
      throw new Error("agentRunId is required (or set GO2_AGENT_RUN_ID).");
    }

    const archivedIds: string[] = [];
    let page = 1;
    while (true) {
      const query = new URLSearchParams({
        agentRunId: runId,
        page: String(page),
        perPage: "100",
      });
      const response = await fetch(`${this.apiUrl}/api/v1/links?${query.toString()}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const body = (await response.json()) as {
        data?: Array<{ id: string; agentRunId?: string | null }>;
        meta?: { hasMore?: boolean };
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message ?? `API error: ${response.status}`);
      }
      // Server filters by agentRunId; the extra filter is belt-and-suspenders
      // in case an older API build silently ignores the query param.
      const links = (body.data ?? []).filter(
        (l) => !l.agentRunId || l.agentRunId === runId
      );
      for (const link of links) {
        await this.updateLink(link.id, { isArchived: true });
        archivedIds.push(link.id);
      }
      if (!body.meta?.hasMore) break;
      page += 1;
      if (page > 50) break;
    }
    return { archived: archivedIds.length, ids: archivedIds };
  }

  /**
   * List clicks attributed to a given agent / run / actor.
   */
  async listAttribution(params: {
    agentId?: string;
    agentRunId?: string;
    agentActorId?: string;
    linkId?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ clicks: AttributionRow[]; page: number; perPage: number }> {
    const query = new URLSearchParams();
    const merged = {
      agentId: params.agentId ?? this.agentContext.agentId,
      agentRunId: params.agentRunId ?? this.agentContext.agentRunId,
      agentActorId: params.agentActorId ?? this.agentContext.agentActorId,
      linkId: params.linkId,
      page: params.page,
      perPage: params.perPage,
    };
    if (merged.agentId) query.set("agentId", merged.agentId);
    if (merged.agentRunId) query.set("agentRunId", merged.agentRunId);
    if (merged.agentActorId) query.set("agentActorId", merged.agentActorId);
    if (merged.linkId) query.set("linkId", merged.linkId);
    if (merged.page) query.set("page", String(merged.page));
    if (merged.perPage) query.set("perPage", String(merged.perPage));

    const path = query.toString() ? `/agent-attribution?${query.toString()}` : "/agent-attribution";
    return this.request<{ clicks: AttributionRow[]; page: number; perPage: number }>("GET", path);
  }

  /**
   * List distinct (agentId, agentRunId) pairs the caller has produced clicks for.
   */
  async listRuns(params: {
    agentId?: string;
    limit?: number;
  } = {}): Promise<{ runs: RunSummary[] }> {
    const query = new URLSearchParams();
    const agentId = params.agentId ?? this.agentContext.agentId;
    if (agentId) query.set("agentId", agentId);
    if (params.limit) query.set("limit", String(params.limit));
    const path = query.toString()
      ? `/agent-attribution/runs?${query.toString()}`
      : "/agent-attribution/runs";
    return this.request<{ runs: RunSummary[] }>("GET", path);
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
    folderId?: string | "none";
  }): Promise<PaginatedResponse<Link>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.search) query.set("search", params.search);
    if (params?.domain) query.set("domain", params.domain);
    if (params?.tag) query.set("tag", params.tag);
    if (params?.archived !== undefined) query.set("archived", String(params.archived));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.folderId) query.set("folderId", params.folderId);

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
      folderId?: string | null;
    }
  ): Promise<Link> {
    return this.request<Link>("PATCH", `/links/${id}`, input);
  }

  /** Folder CRUD + link membership + analytics. */
  async createFolder(input: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }): Promise<Folder> {
    return this.request<Folder>("POST", "/folders", input);
  }

  async listFolders(params?: {
    page?: number;
    perPage?: number;
    parentId?: string;
  }): Promise<PaginatedResponse<Folder>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.parentId) query.set("parentId", params.parentId);
    const queryString = query.toString();
    const path = queryString ? `/folders?${queryString}` : "/folders";

    const response = await fetch(`${this.apiUrl}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message ?? `API error: ${response.status}`);
    }
    return { data: result.data as Folder[], meta: result.meta };
  }

  async getFolder(id: string): Promise<Folder> {
    return this.request<Folder>("GET", `/folders/${id}`);
  }

  async updateFolder(
    id: string,
    input: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      parentId?: string | null;
    }
  ): Promise<Folder> {
    return this.request<Folder>("PATCH", `/folders/${id}`, input);
  }

  async deleteFolder(id: string): Promise<void> {
    await this.request("DELETE", `/folders/${id}`);
  }

  async addLinksToFolder(
    folderId: string,
    linkIds: string[]
  ): Promise<{ added: number }> {
    return this.request<{ added: number }>("POST", `/folders/${folderId}/links`, {
      linkIds,
    });
  }

  async removeLinksFromFolder(
    folderId: string,
    linkIds: string[]
  ): Promise<{ removed: number }> {
    return this.request<{ removed: number }>("DELETE", `/folders/${folderId}/links`, {
      linkIds,
    });
  }

  async getFolderAnalytics(
    folderId: string,
    period?: "7d" | "30d" | "90d"
  ): Promise<FolderAnalytics> {
    const query = period ? `?period=${period}` : "";
    return this.request<FolderAnalytics>("GET", `/analytics/folders/${folderId}${query}`);
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
   * Create multiple links at once. Returns both successes and failures so the
   * caller can retry the failures without losing track of which destination
   * URLs were affected.
   */
  async bulkCreateLinks(
    links: Array<Parameters<Go2Client["createLink"]>[0]>
  ): Promise<{
    success: Link[];
    failed: Array<{ destinationUrl: string; error: string }>;
  }> {
    const success: Link[] = [];
    const failed: Array<{ destinationUrl: string; error: string }> = [];

    for (const link of links) {
      try {
        success.push(await this.createLink(link));
      } catch (error) {
        failed.push({
          destinationUrl: link.destinationUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { success, failed };
  }
}

/**
 * Append `at=<toolCallId>` to a short URL so clicks include the per-call ID via
 * the `?at=` query key that `extractAgentContext` reads at redirect time.
 */
function appendToolCallId(shortUrl: string, toolCallId: string): string {
  try {
    const url = new URL(shortUrl);
    url.searchParams.set("at", toolCallId);
    return url.toString();
  } catch {
    const sep = shortUrl.includes("?") ? "&" : "?";
    return `${shortUrl}${sep}at=${encodeURIComponent(toolCallId)}`;
  }
}

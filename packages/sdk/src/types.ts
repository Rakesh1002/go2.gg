/**
 * Go2 SDK Types
 */

// Client options
export interface Go2Options {
  apiKey: string;
  apiUrl?: string;
}

// Agent attribution context — stamped on the link, re-stamped on every click.
// Lets you trace any click back to the agent run that produced the link.
export interface AgentAttributionContext {
  /** Stable identifier for the agent (e.g. "claude-code", "cursor", "mastra"). */
  agentId?: string;
  /** Per-execution identifier so each agent run is isolated. */
  agentRunId?: string;
  /** End-user / persona the agent acted on behalf of. */
  agentActorId?: string;
  /** Free-form JSON metadata. Stored on the link, returned on every click. */
  agentMetadata?: Record<string, unknown>;
}

// Link types
export interface Link {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title: string | null;
  description: string | null;
  tags: string[];
  hasPassword: boolean;
  expiresAt: string | null;
  clickLimit: number | null;
  clickCount: number;
  geoTargets: Record<string, string> | null;
  deviceTargets: Record<string, string> | null;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
  deepLinks: {
    ios: string | null;
    android: string | null;
  };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  // Agent attribution — populated when the link was created with agent context.
  agentId: string | null;
  agentRunId: string | null;
  agentActorId: string | null;
  agentMetadata: Record<string, unknown> | null;
  isArchived: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastClickedAt: string | null;
}

export interface LinkCreateInput extends AgentAttributionContext {
  destinationUrl: string;
  slug?: string;
  domain?: string;
  title?: string;
  description?: string;
  tags?: string[];
  password?: string;
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

export interface LinkUpdateInput extends Partial<LinkCreateInput> {
  isArchived?: boolean;
}

export interface LinkListParams extends Record<string, unknown> {
  page?: number;
  perPage?: number;
  search?: string;
  domain?: string;
  tag?: string;
  archived?: boolean;
  sort?: "created" | "clicks" | "updated";
}

export interface LinkStats {
  totalClicks: number;
  lastClickedAt: string | null;
  byCountry: Array<{ country: string | null; count: number }>;
  byDevice: Array<{ device: string | null; count: number }>;
  byBrowser: Array<{ browser: string | null; count: number }>;
  byReferrer: Array<{ referrer: string | null; count: number }>;
  overTime: Array<{ date: string; count: number }>;
}

// QR Code types
export interface QRCode {
  id: string;
  name: string;
  url: string;
  trackingUrl: string;
  linkId: string | null;
  style: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    logoUrl: string | null;
    logoSize: number;
    cornerRadius: number;
    errorCorrection: string;
  };
  imageUrl: string;
  stats: {
    scanCount: number;
    lastScannedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QRGenerateInput {
  url: string;
  linkId?: string;
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  logoSize?: number;
  cornerRadius?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
  format?: "png" | "svg";
}

export interface QRCreateInput extends QRGenerateInput {
  name: string;
}

export interface QRUpdateInput extends Partial<QRCreateInput> {}

// Domain types
export interface Domain {
  id: string;
  domain: string;
  verificationStatus: "pending" | "verified" | "failed";
  verificationToken: string;
  verifiedAt: string | null;
  sslStatus: string | null;
  defaultRedirectUrl: string | null;
  notFoundUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainCreateInput {
  domain: string;
  defaultRedirectUrl?: string;
  notFoundUrl?: string;
}

// Webhook types
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string; // Only returned on creation
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastStatus: number | null;
  failureCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface WebhookCreateInput {
  name: string;
  url: string;
  events: string[];
}

export interface WebhookUpdateInput extends Partial<WebhookCreateInput> {
  isActive?: boolean;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  duration: number | null;
  success: boolean;
  attempts: number;
  createdAt: string;
}

// Gallery types
export interface Gallery {
  id: string;
  slug: string;
  domain: string;
  url: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  themeConfig: Record<string, unknown> | null;
  socialLinks: Array<{ platform: string; url: string }>;
  customCss: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  items?: GalleryItem[];
}

export interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  isVisible: boolean;
  clickCount: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Agent attribution types — query the click stream by agent_id / agent_run_id.

/** A single click event with agent attribution context. */
export interface AgentAttributionClick {
  id: string;
  linkId: string;
  shortUrl: string;
  destinationUrl: string;
  agentId: string | null;
  agentRunId: string | null;
  agentActorId: string | null;
  agentToolCallId: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  isBot: boolean;
  createdAt: string;
}

/** Roll-up grouped by agent_id or agent_run_id. */
export interface AgentAttributionSummaryRow {
  /** The grouping key (either agentId or agentRunId depending on `groupBy`). */
  key: string;
  clicks: number;
  uniqueClicks: number;
  firstClickAt: string;
  lastClickAt: string;
}

/** A distinct (agent_id, agent_run_id) pair with click counts. */
export interface AgentRun {
  agentId: string | null;
  agentRunId: string | null;
  clicks: number;
  firstClickAt: string;
  lastClickAt: string;
}

export interface AgentAttributionListParams extends Record<string, unknown> {
  agentId?: string;
  agentRunId?: string;
  agentActorId?: string;
  linkId?: string;
  page?: number;
  perPage?: number;
}

export interface AgentAttributionSummaryParams extends Record<string, unknown> {
  groupBy?: "agent_id" | "agent_run_id";
  agentId?: string;
  agentRunId?: string;
  since?: string;
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

export type ConversionType = "page_view" | "signup" | "purchase" | "lead" | "download" | "custom";

export interface ConversionGoal {
  id: string;
  name: string;
  type: ConversionType;
  urlPattern?: string | null;
  eventName?: string | null;
  attributionWindow: number;
  hasValue: boolean;
  defaultValue?: number | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionGoalCreateInput {
  name: string;
  type: ConversionType;
  urlPattern?: string;
  eventName?: string;
  attributionWindow?: number;
  hasValue?: boolean;
  defaultValue?: number;
  currency?: string;
}

export interface ConversionTrackInput {
  /** Direct linkId reference. Use this OR clickId OR trackingId. */
  linkId?: string;
  /** Direct clickId reference. */
  clickId?: string;
  /** `linkId:clickId` token from the go2_ref cookie/query/metadata. */
  trackingId?: string;
  type: ConversionType;
  eventName?: string;
  goalId?: string;
  /** Integer cents to align with the conversions schema. */
  value?: number;
  /** ISO 4217 currency code (lowercase). Defaults to "usd". */
  currency?: string;
  /** Idempotency key, e.g. Stripe charge id, order number. */
  externalId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface Conversion {
  id: string;
  linkId: string;
  clickId?: string | null;
  goalId?: string | null;
  type: ConversionType;
  eventName?: string | null;
  value?: number | null;
  currency: string;
  externalId?: string | null;
  customerId?: string | null;
  attributedAt?: string | null;
  convertedAt: string;
  country?: string | null;
  device?: string | null;
  browser?: string | null;
  referrer?: string | null;
  abTestId?: string | null;
  abVariant?: string | null;
}

export interface ConversionTrackResult {
  ok: true;
  status: "created" | "duplicate";
  conversion: Conversion;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsOverview {
  totalClicks: number;
  uniqueVisitors: number;
  topCountry: string | null;
  topDevice: string | null;
  clicksTrend: number;
}

export interface AnalyticsClicksOverTime {
  data: Array<{ date: string; clicks: number }>;
  /** Present when `compare=previous` was set. */
  previous?: Array<{ date: string; clicks: number }>;
}

export interface RecentClick {
  id: string;
  linkId: string;
  slug: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  isBot: boolean | null;
  isUnique: boolean | null;
  agentId: string | null;
  timestamp: string;
}

// Type aliases for backwards compatibility
export type CreateLinkInput = LinkCreateInput;
export type UpdateLinkInput = LinkUpdateInput;
export type CreateDomainInput = DomainCreateInput;
export type CreateWebhookInput = WebhookCreateInput;
export type UpdateWebhookInput = WebhookUpdateInput;
export type CreateGalleryInput = Partial<Gallery>;
export type CreateGalleryItemInput = Partial<GalleryItem>;
export type CreateQRInput = QRCreateInput;
export type GenerateQRInput = QRGenerateInput;
export type PaginationParams = {
  page?: number;
  perPage?: number;
};

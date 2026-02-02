/**
 * Go2 SDK Types
 */

// Client options
export interface Go2Options {
  apiKey: string;
  apiUrl?: string;
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
  isArchived: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastClickedAt: string | null;
}

export interface LinkCreateInput {
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

/**
 * QR Codes Resource
 */

import type { Go2 } from "../client";
import type { QRCode, CreateQRInput, GenerateQRInput, PaginationParams } from "../types";

export interface GeneratedQR {
  svg: string;
  format: string;
  size: number;
  url: string;
}

export class QRResource {
  constructor(private readonly client: Go2) {}

  /**
   * Generate a QR code (without saving)
   */
  async generate(input: GenerateQRInput): Promise<GeneratedQR> {
    return this.client.request<GeneratedQR>("POST", "/qr/generate", { body: input });
  }

  /**
   * List all saved QR codes
   */
  async list(params?: PaginationParams) {
    return this.client.requestPaginated<QRCode>("/qr", {
      page: params?.page,
      perPage: params?.perPage,
    });
  }

  /**
   * Save a QR code configuration
   */
  async create(input: CreateQRInput): Promise<QRCode> {
    return this.client.request<QRCode>("POST", "/qr", { body: input });
  }

  /**
   * Get a QR code by ID
   */
  async get(id: string): Promise<QRCode> {
    return this.client.request<QRCode>("GET", `/qr/${id}`);
  }

  /**
   * Update a QR code
   */
  async update(id: string, input: Partial<CreateQRInput>): Promise<QRCode> {
    return this.client.request<QRCode>("PATCH", `/qr/${id}`, { body: input });
  }

  /**
   * Delete a QR code
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>("DELETE", `/qr/${id}`);
  }

  /**
   * Download QR code as SVG
   * Note: Returns raw SVG string
   */
  async download(id: string, format: "svg" | "png" = "svg"): Promise<string> {
    // This would normally return a buffer or blob
    // For simplicity, we return the SVG string
    const config = { baseUrl: "https://api.go2.gg" }; // TODO: get from client
    const response = await fetch(`${config.baseUrl}/api/v1/qr/${id}/download?format=${format}`, {
      headers: {
        Authorization: `Bearer ${(this.client as unknown as { config: { apiKey: string } }).config?.apiKey}`,
      },
    });
    return response.text();
  }
}

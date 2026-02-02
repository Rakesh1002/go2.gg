/**
 * Galleries Resource (Link-in-Bio)
 */

import type { Go2 } from "../client";
import type {
  Gallery,
  GalleryItem,
  CreateGalleryInput,
  CreateGalleryItemInput,
  PaginationParams,
} from "../types";

export class GalleriesResource {
  constructor(private readonly client: Go2) {}

  /**
   * List all galleries
   */
  async list(params?: PaginationParams) {
    return this.client.requestPaginated<Gallery>("/galleries", {
      page: params?.page,
      perPage: params?.perPage,
    });
  }

  /**
   * Create a new gallery (bio page)
   */
  async create(input: CreateGalleryInput): Promise<Gallery> {
    return this.client.request<Gallery>("POST", "/galleries", { body: input });
  }

  /**
   * Get a gallery by ID with all items
   */
  async get(id: string): Promise<Gallery> {
    return this.client.request<Gallery>("GET", `/galleries/${id}`);
  }

  /**
   * Update a gallery
   */
  async update(id: string, input: Partial<CreateGalleryInput>): Promise<Gallery> {
    return this.client.request<Gallery>("PATCH", `/galleries/${id}`, { body: input });
  }

  /**
   * Delete a gallery
   */
  async delete(id: string): Promise<void> {
    return this.client.request<void>("DELETE", `/galleries/${id}`);
  }

  /**
   * Publish or unpublish a gallery
   */
  async publish(id: string, isPublished: boolean): Promise<{ isPublished: boolean }> {
    return this.client.request<{ isPublished: boolean }>("POST", `/galleries/${id}/publish`, {
      body: { isPublished },
    });
  }

  /**
   * Add an item to a gallery
   */
  async addItem(galleryId: string, input: CreateGalleryItemInput): Promise<GalleryItem> {
    return this.client.request<GalleryItem>("POST", `/galleries/${galleryId}/items`, {
      body: input,
    });
  }

  /**
   * Update a gallery item
   */
  async updateItem(
    galleryId: string,
    itemId: string,
    input: Partial<CreateGalleryItemInput>
  ): Promise<GalleryItem> {
    return this.client.request<GalleryItem>("PATCH", `/galleries/${galleryId}/items/${itemId}`, {
      body: input,
    });
  }

  /**
   * Delete a gallery item
   */
  async deleteItem(galleryId: string, itemId: string): Promise<void> {
    return this.client.request<void>("DELETE", `/galleries/${galleryId}/items/${itemId}`);
  }

  /**
   * Reorder gallery items
   */
  async reorderItems(galleryId: string, itemIds: string[]): Promise<{ success: boolean }> {
    return this.client.request<{ success: boolean }>(
      "PATCH",
      `/galleries/${galleryId}/items/reorder`,
      { body: { itemIds } }
    );
  }
}

/**
 * Pagination Utilities
 *
 * Standard pagination, filtering, and sorting for API endpoints.
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Pagination Schema
// -----------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// -----------------------------------------------------------------------------
// Sort Schema
// -----------------------------------------------------------------------------

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SortInput = z.infer<typeof sortSchema>;

// -----------------------------------------------------------------------------
// Pagination Result
// -----------------------------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  pagination: PaginationInput
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pagination.perPage);

  return {
    items,
    meta: {
      page: pagination.page,
      perPage: pagination.perPage,
      total,
      totalPages,
      hasMore: pagination.page < totalPages,
    },
  };
}

// -----------------------------------------------------------------------------
// Offset Calculation
// -----------------------------------------------------------------------------

export function getOffset(pagination: PaginationInput): number {
  return (pagination.page - 1) * pagination.perPage;
}

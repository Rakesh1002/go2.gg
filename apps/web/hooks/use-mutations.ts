"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, type Link, type Domain } from "./use-queries";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ============================================================================
// Link Mutations
// ============================================================================

interface CreateLinkData {
  destinationUrl: string;
  slug?: string;
  domain?: string;
  title?: string;
  expiresAt?: string;
  password?: string;
  tags?: string[];
}

async function createLink(data: CreateLinkData): Promise<Link> {
  const response = await fetch(`${API_URL}/api/v1/links`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create link");
  }

  const result = await response.json();
  return result.data;
}

async function deleteLink(linkId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/links/${linkId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete link");
  }
}

interface UpdateLinkData {
  id: string;
  destinationUrl?: string;
  slug?: string;
  title?: string;
  expiresAt?: string | null;
  password?: string | null;
  tags?: string[];
}

async function updateLink(data: UpdateLinkData): Promise<Link> {
  const { id, ...updateData } = data;
  const response = await fetch(`${API_URL}/api/v1/links/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update link");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Mutation hook for creating a new link
 * Automatically invalidates all related queries on success
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLink,
    onSuccess: () => {
      // Invalidate all stats and links queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create link");
    },
  });
}

/**
 * Mutation hook for deleting a link
 * Automatically invalidates all related queries on success
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      // Invalidate all stats and links queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete link");
    },
  });
}

/**
 * Mutation hook for updating a link
 * Automatically invalidates the specific link and lists
 */
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLink,
    onSuccess: (data) => {
      // Invalidate the specific link and all link lists
      queryClient.invalidateQueries({ queryKey: queryKeys.link(data.id) });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update link");
    },
  });
}

// ============================================================================
// Domain Mutations
// ============================================================================

interface AddDomainData {
  domain: string;
}

async function addDomain(data: AddDomainData): Promise<Domain> {
  const response = await fetch(`${API_URL}/api/v1/domains`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add domain");
  }

  const result = await response.json();
  return result.data;
}

async function deleteDomain(domainId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/domains/${domainId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete domain");
  }
}

async function verifyDomain(domainId: string): Promise<{ verified: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/v1/domains/${domainId}/verify`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to verify domain");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Mutation hook for adding a new domain
 */
export function useAddDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add domain");
    },
  });
}

/**
 * Mutation hook for deleting a domain
 */
export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete domain");
    },
  });
}

/**
 * Mutation hook for verifying a domain
 */
export function useVerifyDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify domain");
    },
  });
}

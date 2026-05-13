/**
 * Better Auth Client
 *
 * Client-side auth utilities for React/Next.js apps.
 * This provides hooks and methods for auth operations.
 */

import { createAuthClient } from "better-auth/react";

export interface AuthClientConfig {
  /** Base URL of the API (e.g., https://api.go2.gg) */
  baseUrl: string;
}

/**
 * Create a Better Auth client for React apps
 *
 * Usage:
 * ```tsx
 * const { useSession, signIn, signOut } = createBetterAuthClient({ baseUrl: "https://api.example.com" });
 * ```
 */
export function createBetterAuthClient(config: AuthClientConfig) {
  return createAuthClient({
    baseURL: config.baseUrl,
    fetchOptions: {
      credentials: "include",
    },
  });
}

// Export types
export type AuthClient = ReturnType<typeof createBetterAuthClient>;

// Re-export createAuthClient for direct usage
export { createAuthClient } from "better-auth/react";

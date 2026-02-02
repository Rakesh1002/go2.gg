/**
 * Better Auth Client
 *
 * Client-side auth for the web app.
 * Uses Better Auth React client for hooks and auth operations.
 */

import { createAuthClient } from "better-auth/react";

// API base URL for auth operations
// Better Auth routes are mounted at /api/v1/auth in our API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

/**
 * Better Auth client instance
 * Use this for all auth operations in the web app
 */
export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/v1/auth`,
  fetchOptions: {
    credentials: "include", // Include cookies for cross-origin requests
  },
});

// Export individual hooks and methods
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Export the full client for advanced usage
export default authClient;

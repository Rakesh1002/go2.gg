/**
 * Auth Module
 *
 * Re-exports auth utilities for client and server.
 *
 * Usage (Client Components):
 * ```tsx
 * "use client";
 * import { useSession, signIn, signOut } from "@/lib/auth/client";
 *
 * function MyComponent() {
 *   const { data: session } = useSession();
 *   // ...
 * }
 * ```
 *
 * Usage (Server Components):
 * ```tsx
 * import { getServerSession, getServerUser } from "@/lib/auth/server";
 *
 * async function MyPage() {
 *   const session = await getServerSession();
 *   // ...
 * }
 * ```
 */

// Client exports (use in "use client" components)
export {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} from "./client";

// Server exports (use in Server Components/API routes)
export {
  getServerSession,
  getServerUser,
  isAuthenticated,
  type AuthUser,
  type AuthSession,
} from "./server";

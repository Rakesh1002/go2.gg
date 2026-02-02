/**
 * Auth Types
 *
 * Shared types for the auth system.
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// User Types
// -----------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  organizationId?: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// -----------------------------------------------------------------------------
// Auth Operations
// -----------------------------------------------------------------------------

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// -----------------------------------------------------------------------------
// Auth Provider Interface
// -----------------------------------------------------------------------------

export interface AuthProvider {
  readonly name: string;

  /**
   * Get the current session if authenticated.
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Get the current user if authenticated.
   */
  getUser(): Promise<AuthUser | null>;

  /**
   * Sign up with email and password.
   */
  signUp(input: SignUpInput): Promise<AuthSession>;

  /**
   * Sign in with email and password.
   */
  signIn(input: SignInInput): Promise<AuthSession>;

  /**
   * Sign in with OAuth provider.
   */
  signInWithOAuth(provider: OAuthProvider): Promise<{ url: string }>;

  /**
   * Sign in with magic link.
   */
  signInWithMagicLink(email: string): Promise<void>;

  /**
   * Sign out the current user.
   */
  signOut(): Promise<void>;

  /**
   * Request password reset.
   */
  resetPassword(input: ResetPasswordInput): Promise<void>;

  /**
   * Update password (requires authenticated session).
   */
  updatePassword(input: UpdatePasswordInput): Promise<void>;

  /**
   * Refresh the current session.
   */
  refreshSession(): Promise<AuthSession | null>;
}

// -----------------------------------------------------------------------------
// OAuth Providers
// -----------------------------------------------------------------------------

export const oauthProviders = ["google", "github", "discord", "twitter"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

// -----------------------------------------------------------------------------
// Auth Errors
// -----------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode,
    public readonly status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "EMAIL_NOT_VERIFIED"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR";

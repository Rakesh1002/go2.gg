-- Migration: Rename accounts table and columns to match Better Auth expectations
-- This renames the table from "accounts" to "account" and updates column names

-- SQLite doesn't support ALTER TABLE RENAME COLUMN directly in older versions
-- We need to recreate the table with the new structure

-- Step 1: Create the new table with Better Auth column names
CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "providerId" text NOT NULL,
    "accountId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "accessTokenExpiresAt" text,
    "refreshTokenExpiresAt" text,
    "scope" text,
    "idToken" text,
    "createdAt" text DEFAULT (datetime('now')) NOT NULL,
    "updatedAt" text DEFAULT (datetime('now')) NOT NULL
);

-- Step 2: Copy data from old table to new table (if old table exists)
INSERT OR IGNORE INTO "account" ("id", "userId", "providerId", "accountId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "idToken", "createdAt", "updatedAt")
SELECT "id", "user_id", "provider", "provider_account_id", "access_token", "refresh_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "id_token", "created_at", "updated_at"
FROM "accounts";

-- Step 3: Drop the old table
DROP TABLE IF EXISTS "accounts";

-- Step 4: Create indexes on the new table
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "account" ("providerId", "accountId");
CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "account" ("userId");

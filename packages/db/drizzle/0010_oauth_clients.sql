-- Migration: OAuth 2.1 client + token tables for the remote MCP transport
-- and any future third-party agent integrations. RFC 6749 + RFC 7591 dynamic
-- client registration, with PKCE (RFC 7636) required.

CREATE TABLE IF NOT EXISTS oauth_clients (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT,
  name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,
  grant_types TEXT NOT NULL DEFAULT '["authorization_code","refresh_token"]',
  response_types TEXT NOT NULL DEFAULT '["code"]',
  scopes TEXT NOT NULL DEFAULT '[]',
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  contacts TEXT,
  logo_uri TEXT,
  client_uri TEXT,
  policy_uri TEXT,
  tos_uri TEXT,
  software_id TEXT,
  software_version TEXT,
  registration_access_token_hash TEXT,
  is_dynamic INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS oauth_clients_client_id_idx ON oauth_clients(client_id);

CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  redirect_uri TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  resource TEXT,
  consumed_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS oauth_authz_codes_client_idx ON oauth_authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS oauth_authz_codes_user_idx ON oauth_authorization_codes(user_id);
CREATE INDEX IF NOT EXISTS oauth_authz_codes_expires_idx ON oauth_authorization_codes(expires_at);

CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  client_metadata TEXT,
  last_used_at TEXT,
  revoked_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS oauth_access_tokens_client_idx ON oauth_access_tokens(client_id);
CREATE INDEX IF NOT EXISTS oauth_access_tokens_user_idx ON oauth_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS oauth_access_tokens_expires_idx ON oauth_access_tokens(expires_at);

CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  access_token_id TEXT,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  revoked_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS oauth_refresh_tokens_user_idx ON oauth_refresh_tokens(user_id);

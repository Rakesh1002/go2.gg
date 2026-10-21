-- Cloudflare for SaaS: remember the custom hostname id returned when a verified
-- domain is provisioned, so we can poll its SSL status and delete it on removal.

ALTER TABLE domains ADD COLUMN custom_hostname_id TEXT;

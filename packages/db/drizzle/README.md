# Drizzle migrations directory — source of truth notes

**`wrangler d1 migrations apply` is authoritative**, not `drizzle-kit migrate`.

We use Drizzle ORM for the schema definition (`src/schema.ts`), but apply
migrations via Cloudflare's D1 migrations tooling. That means:

- The `.sql` files in this directory are applied **in alphabetical order** by
  `wrangler d1 migrations apply go2-db --remote`.
- D1 tracks applied migrations in its own `d1_migrations` table — not in
  `meta/_journal.json`.
- `meta/_journal.json` stops at idx 7 (legacy) and the `meta/*_snapshot.json`
  files do not cover migrations 0008+. This is **expected** and intentional —
  drizzle-kit is not part of the migration pipeline.

## Adding a new migration

```bash
# 1. Pick the next number (max existing + 1)
ls packages/db/drizzle/*.sql | tail -1

# 2. Write the .sql file as 00NN_descriptive_name.sql
$EDITOR packages/db/drizzle/0019_my_change.sql

# 3. Update src/schema.ts to mirror the change

# 4. Apply locally then remote
wrangler d1 migrations apply go2-db --local  --config apps/api/wrangler.toml
wrangler d1 migrations apply go2-db --remote --config apps/api/wrangler.toml --env production
```

## Drift recovery

If `wrangler d1 migrations apply` fails with "duplicate column" / "table
exists" errors, a migration was applied out-of-band. Record it as already
applied:

```bash
wrangler d1 execute go2-db --remote --config apps/api/wrangler.toml \
  --command "INSERT INTO d1_migrations (name, applied_at) VALUES ('00NN_name.sql', datetime('now'))"
```

Then re-run `wrangler d1 migrations apply` — it will skip the recorded one
and continue with the rest.

## Why not drizzle-kit?

We tried. It generates SQL that doesn't always match what we want for D1's
SQLite (e.g. composite indexes, foreign-key cascade semantics, default
expressions like `(datetime('now'))`). Hand-written SQL is clearer for
reviewers and predictable for ops. The schema-as-TypeScript still drives
typed reads/writes everywhere in the app — drizzle-kit is just not used for
migration codegen.

import { DatabaseSync } from "node:sqlite";
import * as schema from "@repo/db";

// The drizzle/ migration chain no longer replays on an empty database (it was applied to prod
// out of order), so tests build the tables straight from schema.ts, which is what the code reads.
const ddl = (async () => {
  const kit = await import("../../../packages/db/node_modules/drizzle-kit/api.mjs");
  const [empty, current] = await Promise.all([
    kit.generateSQLiteDrizzleJson({}),
    kit.generateSQLiteDrizzleJson(schema),
  ]);
  // schema.ts reuses an index name across two tables; SQLite index names are database-wide.
  return (await kit.generateSQLiteMigration(empty, current)).map((statement) =>
    statement.replace(/^CREATE (UNIQUE )?INDEX /, "CREATE $1INDEX IF NOT EXISTS ")
  );
})();

/** In-memory D1 stand-in with the current schema. */
export async function createTestD1() {
  // Tests seed rows without their parent users/orgs.
  const sqlite = new DatabaseSync(":memory:", { enableForeignKeyConstraints: false });
  for (const statement of await ddl) sqlite.exec(statement);

  const prepare = (query: string) => {
    const stmt = sqlite.prepare(query);
    const bind = (...params: never[]) => ({
      batchResult: () => ({ success: true, results: stmt.all(...params), meta: {} }),
      all: async () => ({ results: stmt.all(...params) }),
      raw: async () => {
        stmt.setReturnArrays(true);
        try {
          return stmt.all(...params);
        } finally {
          stmt.setReturnArrays(false);
        }
      },
      first: async () => stmt.get(...params) ?? null,
      run: async () => ({ success: true, meta: { changes: Number(stmt.run(...params).changes) } }),
    });
    return { bind, ...bind() };
  };

  // D1 runs a batch as one transaction that no other statement interleaves with.
  const batch = async (stmts: Array<{ batchResult: () => unknown }>) => {
    sqlite.exec("BEGIN");
    try {
      const results = stmts.map((stmt) => stmt.batchResult());
      sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  };

  return { d1: { prepare, batch } as unknown as D1Database, sqlite };
}

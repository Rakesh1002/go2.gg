import { fileURLToPath } from "node:url";

// test/ holds node:test suites (node --test test/*.test.ts); __tests__/ holds the vitest ones.
// Alias the `cloudflare:workers` module (only reachable transitively via the
// Workflow exports in src/index.ts) to a stub so tests can import the full app.
export default {
  resolve: {
    alias: {
      "cloudflare:workers": fileURLToPath(
        new URL("./__tests__/stubs/cloudflare-workers.ts", import.meta.url)
      ),
    },
  },
  test: { include: ["__tests__/**/*.test.ts"] },
};

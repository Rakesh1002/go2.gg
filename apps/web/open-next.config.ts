import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Prerendered/ISR pages persist in NEXT_CACHE_KV instead of re-rendering on
// every request (the default config used the dummy cache, which made every
// marketing pageview a full SSR). Cache interception stays off — it has
// issues with catch-all routes like [slug], and the API worker's apex cache
// layer already serves anonymous marketing GETs from the edge.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});

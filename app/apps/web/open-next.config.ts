import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// For SSG sites with no revalidation, use static assets cache
// Note: enableCacheInterception has issues with catch-all routes [[...slug]]
export default defineCloudflareConfig({});

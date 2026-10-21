import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          compatibilityDate: "2024-09-23",
          // The vitest-pool-workers runner itself requires nodejs_compat.
          compatibilityFlags: ["nodejs_compat"],
          kvNamespaces: ["LINKS_KV"],
          // Stub the monolith. Forwarded requests echo their path + the
          // track-only header so tests can assert what was forwarded.
          serviceBindings: {
            API(request: Request) {
              const u = new URL(request.url);
              return new Response(`FORWARDED ${u.pathname}`, {
                status: 200,
                headers: {
                  "x-mock": "api",
                  "x-track-only": request.headers.get("x-go2-track-only") ?? "",
                  "x-bio-domain": request.headers.get("x-go2-bio-domain") ?? "",
                },
              });
            },
          },
        },
        main: "./src/index.ts",
      },
    },
  },
});

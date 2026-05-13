import type { Env } from "../bindings.js";

interface BuildOpenApiOptions {
  apiUrl: string;
  appUrl?: string;
}

export function buildOpenApiSpec({ apiUrl, appUrl }: BuildOpenApiOptions) {
  const servers: Array<{ url: string; description: string }> = [
    { url: apiUrl, description: "Production" },
  ];
  if (appUrl && appUrl !== apiUrl) {
    servers.push({ url: appUrl, description: "App" });
  }
  servers.push({ url: "http://localhost:8787", description: "Development" });

  return {
    openapi: "3.1.0",
    info: {
      title: "Go2 API",
      version: "1.0.0",
      summary: "The link primitive for AI agents and humans.",
      description:
        "Go2 is a Cloudflare-native short-link platform with first-class agent attribution. " +
        "Every link an agent creates can carry (agent_id, agent_run_id, agent_actor_id, agent_tool_call_id), " +
        "and every click is queryable through this REST API, the go2-mcp-server, or outgoing webhooks.\n\n" +
        "Authenticate with `Authorization: Bearer go2_...` (API key) or an OAuth 2.1 access token.",
      contact: { name: "Go2", url: "https://go2.gg", email: "hello@go2.gg" },
      license: { name: "AGPL-3.0", url: "https://www.gnu.org/licenses/agpl-3.0.html" },
      "x-logo": { url: "https://go2.gg/og-image.png", altText: "Go2" },
    },
    servers,
    tags: [
      { name: "Links", description: "Create, update, list, and archive short links." },
      {
        name: "Agent attribution",
        description: "Per-run / per-agent click streams and rollups.",
      },
      { name: "Analytics", description: "Per-link click analytics and aggregates." },
      { name: "QR", description: "QR code generation for links." },
      { name: "Domains", description: "Custom domain management." },
      { name: "API keys", description: "Programmatic access tokens." },
      { name: "Webhooks", description: "Outgoing event subscriptions." },
      { name: "Usage", description: "Current-period usage counters." },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "go2_API_KEY",
          description: "API key issued from the Go2 dashboard. Format: `Authorization: Bearer go2_...`.",
        },
        oauth2: {
          type: "oauth2",
          description: "OAuth 2.1 authorization code flow with PKCE for remote MCP / agent integrations.",
          flows: {
            authorizationCode: {
              authorizationUrl: `${apiUrl}/api/v1/auth/oauth2/authorize`,
              tokenUrl: `${apiUrl}/api/v1/auth/oauth2/token`,
              scopes: {
                "links:read": "List and read links.",
                "links:write": "Create, update, and archive links.",
                "analytics:read": "Read per-link analytics.",
                "attribution:read": "Read agent attribution streams.",
                "attribution:write": "Mutate agent attribution metadata.",
                "webhooks:read": "List webhook subscriptions.",
                "webhooks:write": "Manage webhook subscriptions.",
              },
            },
          },
        },
      },
      parameters: {
        Page: {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        PerPage: {
          name: "perPage",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: {},
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {},
            error: { $ref: "#/components/schemas/Error" },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                perPage: { type: "integer" },
                total: { type: "integer" },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        AgentContext: {
          type: "object",
          description:
            "Per-link agent attribution context. Defaults are inherited at click time " +
            "but can be overridden per click via `?ag=&ar=&at=&au=` query params or `x-agent-*` headers.",
          properties: {
            agentId: { type: "string", maxLength: 200, example: "claude-code" },
            agentRunId: { type: "string", maxLength: 200, example: "run_2026_04_27_abc123" },
            agentActorId: { type: "string", maxLength: 200, example: "user_pranav" },
            agentMetadata: {
              type: "object",
              additionalProperties: true,
              description: "Free-form JSON. Surfaced verbatim in click events.",
            },
          },
        },
        Link: {
          type: "object",
          required: ["id", "domain", "slug", "destinationUrl"],
          properties: {
            id: { type: "string" },
            organizationId: { type: "string", nullable: true },
            domain: { type: "string", example: "go2.gg" },
            slug: { type: "string", example: "launch-2026" },
            destinationUrl: { type: "string", format: "uri" },
            title: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            password: { type: "string", nullable: true, writeOnly: true },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            clickLimit: { type: "integer", nullable: true },
            clickCount: { type: "integer" },
            geoTargets: {
              type: "object",
              additionalProperties: { type: "string", format: "uri" },
              nullable: true,
            },
            iosUrl: { type: "string", format: "uri", nullable: true },
            androidUrl: { type: "string", format: "uri", nullable: true },
            ogTitle: { type: "string", nullable: true },
            ogDescription: { type: "string", nullable: true },
            ogImage: { type: "string", format: "uri", nullable: true },
            agentId: { type: "string", nullable: true },
            agentRunId: { type: "string", nullable: true },
            agentActorId: { type: "string", nullable: true },
            agentMetadata: { type: "object", additionalProperties: true, nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateLinkRequest: {
          type: "object",
          required: ["destinationUrl"],
          properties: {
            destinationUrl: { type: "string", format: "uri" },
            slug: { type: "string", description: "Auto-generated if omitted." },
            domain: { type: "string", default: "go2.gg" },
            title: { type: "string" },
            description: { type: "string" },
            password: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            clickLimit: { type: "integer", minimum: 1 },
            geoTargets: { type: "object", additionalProperties: { type: "string", format: "uri" } },
            iosUrl: { type: "string", format: "uri" },
            androidUrl: { type: "string", format: "uri" },
            agentId: { type: "string" },
            agentRunId: { type: "string" },
            agentActorId: { type: "string" },
            agentMetadata: { type: "object", additionalProperties: true },
          },
        },
        Click: {
          type: "object",
          properties: {
            id: { type: "string" },
            linkId: { type: "string" },
            country: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            device: { type: "string", nullable: true },
            browser: { type: "string", nullable: true },
            os: { type: "string", nullable: true },
            referrer: { type: "string", nullable: true },
            isBot: { type: "boolean" },
            isUnique: { type: "boolean" },
            agentId: { type: "string", nullable: true },
            agentRunId: { type: "string", nullable: true },
            agentActorId: { type: "string", nullable: true },
            agentToolCallId: { type: "string", nullable: true },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        AttributionRun: {
          type: "object",
          properties: {
            agentId: { type: "string", nullable: true },
            agentRunId: { type: "string", nullable: true },
            clicks: { type: "integer" },
            uniqueClicks: { type: "integer" },
            firstClickAt: { type: "string", format: "date-time", nullable: true },
            lastClickAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        AttributionSummary: {
          type: "object",
          properties: {
            key: { type: "string" },
            clicks: { type: "integer" },
            uniqueClicks: { type: "integer" },
            lastClickAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            keyPrefix: { type: "string" },
            scopes: {
              type: "array",
              items: { type: "string" },
              description: "Empty array or [\"*\"] means all scopes.",
            },
            lastUsedAt: { type: "string", format: "date-time", nullable: true },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            url: { type: "string", format: "uri" },
            events: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean" },
            failureCount: { type: "integer" },
            lastTriggeredAt: { type: "string", format: "date-time", nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }, { oauth2: ["links:read", "links:write"] }],
    paths: {
      "/api/v1/links": {
        get: {
          tags: ["Links"],
          summary: "List links",
          parameters: [
            { $ref: "#/components/parameters/Page" },
            { $ref: "#/components/parameters/PerPage" },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "domain", in: "query", schema: { type: "string" } },
            { name: "organizationId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Paginated list of links.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { type: "array", items: { $ref: "#/components/schemas/Link" } },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Links"],
          summary: "Create link",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateLinkRequest" } },
            },
          },
          responses: {
            "201": {
              description: "Created.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: { data: { $ref: "#/components/schemas/Link" } },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/links/{id}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          tags: ["Links"],
          summary: "Get a link by id",
          responses: { "200": { description: "Link found." }, "404": { description: "Not found." } },
        },
        patch: {
          tags: ["Links"],
          summary: "Update a link",
          requestBody: {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateLinkRequest" } },
            },
          },
          responses: { "200": { description: "Updated." } },
        },
        delete: {
          tags: ["Links"],
          summary: "Archive a link",
          responses: { "204": { description: "Archived." } },
        },
      },
      "/api/v1/agent-attribution": {
        get: {
          tags: ["Agent attribution"],
          summary: "List clicks filtered by agent context",
          parameters: [
            { name: "agentId", in: "query", schema: { type: "string" } },
            { name: "agentRunId", in: "query", schema: { type: "string" } },
            { name: "agentActorId", in: "query", schema: { type: "string" } },
            { name: "linkId", in: "query", schema: { type: "string" } },
            { $ref: "#/components/parameters/Page" },
            { $ref: "#/components/parameters/PerPage" },
          ],
          responses: {
            "200": {
              description: "Paginated click stream.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { type: "array", items: { $ref: "#/components/schemas/Click" } },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/agent-attribution/summary": {
        get: {
          tags: ["Agent attribution"],
          summary: "Click rollup grouped by agent_id or agent_run_id",
          parameters: [
            {
              name: "groupBy",
              in: "query",
              schema: { type: "string", enum: ["agent_id", "agent_run_id"] },
            },
          ],
          responses: {
            "200": {
              description: "Group totals.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/AttributionSummary" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/agent-attribution/runs": {
        get: {
          tags: ["Agent attribution"],
          summary: "Distinct agent runs with click counts and timestamps",
          parameters: [
            { name: "agentId", in: "query", schema: { type: "string" } },
            { $ref: "#/components/parameters/PerPage" },
          ],
          responses: {
            "200": {
              description: "Run list.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/AttributionRun" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/analytics/{linkId}": {
        get: {
          tags: ["Analytics"],
          summary: "Get per-link analytics",
          parameters: [
            { name: "linkId", in: "path", required: true, schema: { type: "string" } },
            { name: "period", in: "query", schema: { type: "string", example: "7d" } },
          ],
          responses: { "200": { description: "Analytics breakdown." } },
        },
      },
      "/api/v1/qr": {
        post: {
          tags: ["QR"],
          summary: "Generate a QR code (PNG or SVG)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["url"],
                  properties: {
                    url: { type: "string", format: "uri" },
                    format: { type: "string", enum: ["png", "svg"], default: "png" },
                    size: { type: "integer", minimum: 64, maximum: 2048, default: 512 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "QR code bytes." } },
        },
      },
      "/api/v1/domains": {
        get: { tags: ["Domains"], summary: "List custom domains", responses: { "200": { description: "OK." } } },
        post: { tags: ["Domains"], summary: "Add custom domain", responses: { "201": { description: "Added." } } },
      },
      "/api/v1/domains/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: { tags: ["Domains"], summary: "Get domain", responses: { "200": { description: "OK." } } },
        delete: { tags: ["Domains"], summary: "Remove domain", responses: { "204": { description: "Removed." } } },
      },
      "/api/v1/domains/{id}/verify": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          tags: ["Domains"],
          summary: "Verify DNS TXT ownership",
          responses: { "200": { description: "Verification result." } },
        },
      },
      "/api/v1/api-keys": {
        get: {
          tags: ["API keys"],
          summary: "List API keys",
          parameters: [
            { name: "organizationId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK." } },
        },
        post: {
          tags: ["API keys"],
          summary: "Provision a new API key",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "organizationId"],
                  properties: {
                    name: { type: "string", maxLength: 100 },
                    organizationId: { type: "string" },
                    scopes: { type: "array", items: { type: "string" } },
                    expiresAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description:
                "Created. The plaintext key is returned exactly once in the `key` field.",
            },
          },
        },
      },
      "/api/v1/webhooks": {
        get: { tags: ["Webhooks"], summary: "List webhooks", responses: { "200": { description: "OK." } } },
        post: {
          tags: ["Webhooks"],
          summary: "Subscribe to events",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["url", "events"],
                  properties: {
                    name: { type: "string" },
                    url: { type: "string", format: "uri" },
                    events: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Subscribed." } },
        },
      },
      "/api/v1/usage": {
        get: {
          tags: ["Usage"],
          summary: "Current-period usage counters",
          parameters: [
            { name: "organizationId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Counters." } },
        },
      },
    },
  } as const;
}

export function getOpenApiSpec(env: Env) {
  const apiUrl = env.API_URL || "https://api.go2.gg";
  const appUrl = env.APP_URL || "https://go2.gg";
  return buildOpenApiSpec({ apiUrl, appUrl });
}

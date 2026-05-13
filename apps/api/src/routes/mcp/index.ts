import { Hono } from "hono";
import {
  Go2Client,
  DocsClient,
  TOOLS,
  PROMPTS,
  getPrompt,
  dispatchToolCall,
  type AgentContext,
  type PromptName,
} from "go2-mcp-server";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { lookupAccessToken } from "../../lib/oauth.js";
import type { MiddlewareHandler } from "hono";

function oauthBearerMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (c.get("user")) return next();
    const auth = c.req.header("Authorization") ?? "";
    if (!auth.startsWith("Bearer ") || auth.startsWith("Bearer go2_")) return next();
    const token = auth.slice("Bearer ".length).trim();
    const result = await lookupAccessToken(c.env, token);
    if (!result) return next();
    c.set("user", {
      id: result.userId,
      email: "",
      name: null,
      avatarUrl: null,
      emailVerified: false,
      organizationId: result.organizationId ?? undefined,
    });
    c.set("oauthScopes", result.scopes);
    c.set("oauthClientId", result.clientId);
    return next();
  };
}

declare module "hono" {
  interface ContextVariableMap {
    oauthScopes?: string[];
    oauthClientId?: string;
  }
}

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_NAME = "go2-mcp";
const SERVER_VERSION = "0.2.0";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcResponse =
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      result: unknown;
    }
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      error: { code: number; message: string; data?: unknown };
    };

const mcp = new Hono<{ Bindings: Env }>();

mcp.use("/*", oauthBearerMiddleware());
mcp.use("/*", apiKeyAuthMiddleware());

mcp.options("/*", (c) => {
  const origin = c.req.header("Origin");
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, X-Agent-Id, X-Agent-Run-Id, X-Agent-Actor-Id, X-Agent-Tool-Call-Id",
      "Access-Control-Max-Age": "86400",
    },
  });
});

mcp.get("/*", (c) =>
  c.json(
    {
      error: "SSE streaming is not yet enabled on this transport. Send POSTs with Accept: application/json.",
    },
    405
  )
);

mcp.post("/*", async (c) => {
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await c.req.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }

  const sessionId = c.req.header("Mcp-Session-Id") ?? crypto.randomUUID();

  const agentContext: AgentContext = {
    agentId: c.req.header("X-Agent-Id") ?? undefined,
    agentRunId: c.req.header("X-Agent-Run-Id") ?? sessionId,
    agentActorId: c.req.header("X-Agent-Actor-Id") ?? undefined,
    agentToolCallId: c.req.header("X-Agent-Tool-Call-Id") ?? undefined,
  };

  const apiKey = (c.req.header("Authorization") ?? "").replace(/^Bearer\s+/, "");
  const apiUrl = c.env.API_URL || `https://${c.req.header("host") ?? "api.go2.gg"}`;
  const docsUrl = c.env.APP_URL || "https://go2.gg";

  const client = new Go2Client({ apiKey, apiUrl, agentContext });
  const docsClient = new DocsClient({ baseUrl: docsUrl });

  const messages = Array.isArray(body) ? body : [body];
  const responses: JsonRpcResponse[] = [];
  for (const message of messages) {
    if (!message || message.jsonrpc !== "2.0") {
      responses.push({
        jsonrpc: "2.0",
        id: message?.id ?? null,
        error: { code: -32600, message: "Invalid JSON-RPC request" },
      });
      continue;
    }
    if (message.id == null && message.method.startsWith("notifications/")) {
      continue;
    }
    responses.push(await handle(message, { client, docsClient }));
  }

  if (responses.length === 0) {
    return new Response(null, {
      status: 202,
      headers: { "Mcp-Session-Id": sessionId },
    });
  }

  const payload = Array.isArray(body) ? responses : responses[0];
  return c.json(payload, 200, {
    "Mcp-Session-Id": sessionId,
    "Mcp-Protocol-Version": PROTOCOL_VERSION,
  });
});

async function handle(
  message: JsonRpcRequest,
  deps: { client: Go2Client; docsClient: DocsClient }
): Promise<JsonRpcResponse> {
  const { id = null, method, params = {} } = message;
  try {
    switch (method) {
      case "initialize":
        return ok(id, {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          capabilities: { tools: {}, prompts: {} },
          instructions:
            "Go2 MCP server. Use track_agent_link to create attributed short links. " +
            "Use get_run_attribution to read clicks for a run.",
        });
      case "ping":
        return ok(id, {});
      case "tools/list":
        return ok(id, { tools: Object.values(TOOLS) });
      case "tools/call": {
        const { name, arguments: args } = params as {
          name?: string;
          arguments?: Record<string, unknown>;
        };
        if (!name) return err(id, -32602, "Missing tool name");
        const result = await dispatchToolCall(deps, name, args);
        return ok(id, result);
      }
      case "prompts/list":
        return ok(id, { prompts: Object.values(PROMPTS) });
      case "prompts/get": {
        const { name, arguments: args } = params as {
          name?: string;
          arguments?: Record<string, unknown>;
        };
        if (!name) return err(id, -32602, "Missing prompt name");
        return ok(id, getPrompt(name as PromptName, args ?? {}));
      }
      case "logging/setLevel":
        return ok(id, {});
      default:
        return err(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    return err(id, -32603, error instanceof Error ? error.message : "Internal error");
  }
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export { mcp };

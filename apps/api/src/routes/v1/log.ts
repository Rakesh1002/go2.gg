import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../../bindings.js";
import { forwardClientLog, shouldDropClientEvent } from "../../lib/axiom.js";

const log = new Hono<{ Bindings: Env }>();

/**
 * Frontend log forwarder.
 *
 * The web app POSTs structured client errors here; we filter noise and
 * republish to the same Axiom dataset that backend errors flow into. Always
 * 204 — never report ingest failures back to the client (and never block on
 * them either).
 */
const eventSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
  message: z.string().min(1).max(4000),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(200).optional(),
  source: z.string().max(64).optional(),
});

const batchSchema = z.union([eventSchema, z.array(eventSchema).max(20)]);

log.post("/", zValidator("json", batchSchema), async (c) => {
  const body = c.req.valid("json");
  const events = Array.isArray(body) ? body : [body];

  const requestId = c.get("requestId");
  const country = (c.req.raw as { cf?: { country?: string } }).cf?.country;
  const referer = c.req.header("referer") ?? undefined;

  for (const event of events) {
    if (shouldDropClientEvent(event)) continue;
    c.executionCtx?.waitUntil(
      forwardClientLog(c.env, event, {
        requestId,
        country,
        referer,
      }),
    );
  }

  return c.body(null, 204);
});

export { log };

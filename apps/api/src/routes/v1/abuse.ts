/**
 * Abuse reports
 *
 * Public endpoint — anyone can submit a report against a shortlink. We never
 * auto-disable from a single report (coordinated brigading would otherwise
 * let attackers DoS competitor links). Two layers of abuse-of-abuse-channel
 * defence:
 *
 *   1. Turnstile token required on every submission — stops scripted floods.
 *   2. Per-IP rate limit via the RATE_LIMITER Durable Object (atomic, no
 *      read-then-write race the way the prior KV counter had).
 *
 * Flow on success:
 *   - Row lands in `abuse_reports` with status='open'.
 *   - The linked link's `threat_last_checked` is cleared so the next rescan
 *     picks it up immediately.
 *   - Email to abuse@go2.gg via BACKGROUND_QUEUE for human review.
 */
import { zValidator } from "@hono/zod-validator";
import * as schema from "@repo/db";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { logEvent } from "../../lib/axiom.js";
import { badRequest, created } from "../../lib/response.js";
import { turnstileMiddleware } from "../../middleware/turnstile.js";

const abuse = new Hono<{ Bindings: Env }>();

const REPORT_REASONS = [
  "phishing",
  "malware",
  "scam_fraud",
  "impersonation",
  "spam",
  "child_safety",
  "intellectual_property",
  "violence_hate",
  "other",
] as const;

const reportSchema = z.object({
  shortUrl: z.string().url().max(500),
  reason: z.enum(REPORT_REASONS),
  notes: z.string().max(2000).optional(),
  reporterEmail: z.string().email().max(200).optional(),
  // turnstileToken consumed by middleware — accepted here so Zod doesn't reject.
  turnstileToken: z.string().min(10).max(2048).optional(),
});

const REPORTS_PER_HOUR_PER_IP = 5;
const REPORTS_PER_DAY_PER_IP = 20;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Atomic rate-limit check via Durable Object. Returns true when ALLOWED.
 * Replaces the prior read-then-write KV counter that was racy.
 */
async function checkRateLimit(
  env: Env,
  ipHash: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (!env.RATE_LIMITER) return true; // fail open if binding missing (dev)
  try {
    const id = env.RATE_LIMITER.idFromName(`abuse:${ipHash}:${windowSeconds}`);
    const stub = env.RATE_LIMITER.get(id);
    const res = await stub.fetch(
      new Request(`http://rate-limiter/check?limit=${limit}&window=${windowSeconds}`)
    );
    const result = (await res.json()) as { allowed: boolean };
    return result.allowed;
  } catch (err) {
    // Fail open on DO errors — abuse reports should not get blackholed by infra hiccups.
    console.error("abuse: rate limit DO check failed", err);
    return true;
  }
}

// Turnstile middleware runs before validation. It reads the body for the
// token, so the body is buffered/cached by Hono for the next handler.
abuse.post("/", turnstileMiddleware(), zValidator("json", reportSchema), async (c) => {
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const now = new Date().toISOString();

  const rawIp = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "";
  // If we can't get a real IP, refuse the submission rather than bucket every
  // proxy-stripped request into one shared "unknown" slot (prior bug — locked
  // out legit reporters behind corporate proxies).
  if (!rawIp || rawIp === "unknown") {
    return badRequest(c, "Could not identify source IP — please try from a different network.");
  }
  const ipHash = await hashIp(rawIp);

  const [hourOk, dayOk] = await Promise.all([
    checkRateLimit(c.env, ipHash, REPORTS_PER_HOUR_PER_IP, 3600),
    checkRateLimit(c.env, ipHash, REPORTS_PER_DAY_PER_IP, 86400),
  ]);
  if (!hourOk || !dayOk) {
    return badRequest(c, "Too many reports from this IP — try again later.");
  }

  // Resolve the link record from the short URL, if it's one of ours. We accept
  // reports for URLs not in our DB too — sometimes a user pastes a mangled link
  // and we still want the signal.
  let linkId: string | null = null;
  let destinationUrl: string | null = null;
  try {
    const url = new URL(input.shortUrl);
    const slug = url.pathname.replace(/^\//, "").split("/")[0];
    const domain = url.hostname;
    if (slug) {
      const link = await db
        .select({ id: schema.links.id, destinationUrl: schema.links.destinationUrl })
        .from(schema.links)
        .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
        .limit(1);
      if (link[0]) {
        linkId = link[0].id;
        destinationUrl = link[0].destinationUrl;
      }
    }
  } catch {
    // Bad URL — store the raw value anyway for human review.
  }

  // Strip control characters from notes so RTL overrides / zero-width chars
  // can't disorient the human reviewer in the admin queue email.
  const sanitizedNotes = input.notes
    ? input.notes
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, "")
        .slice(0, 2000)
    : undefined;

  const id = crypto.randomUUID();
  await db.insert(schema.abuseReports).values({
    id,
    linkId,
    shortUrl: input.shortUrl,
    destinationUrl,
    reason: input.reason,
    notes: sanitizedNotes,
    reporterEmail: input.reporterEmail,
    reporterIpHash: ipHash,
    status: "open",
    createdAt: now,
  });

  // Prioritise this link in the next rescan by clearing its threat_last_checked
  // bookmark. The cron picks oldest-first, so NULL means "next up."
  if (linkId) {
    await db
      .update(schema.links)
      .set({ threatLastChecked: null, updatedAt: now })
      .where(eq(schema.links.id, linkId));
  }

  // Best-effort: notify abuse@go2.gg via the email queue so the report
  // surfaces in the inbox the same way other ops alerts do.
  if (c.env.BACKGROUND_QUEUE) {
    try {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: "abuse@go2.gg",
          template: "abuse-report",
          data: {
            reportId: id,
            shortUrl: input.shortUrl,
            destinationUrl,
            reason: input.reason,
            notes: sanitizedNotes ?? "",
            reporterEmail: input.reporterEmail ?? "",
            adminUrl: `${c.env.APP_URL}/admin/abuse/${id}`,
          },
        },
      });
    } catch {
      // Queue failure is non-fatal — the row is the source of truth.
    }
  }

  // Audit: every report lands in Axiom for trend analysis (volume by reason,
  // by hour, by IP-hash). Helps detect coordinated brigading vs organic reports.
  await logEvent(
    c.env,
    "abuse.report.received",
    {
      reportId: id,
      linkId,
      reason: input.reason,
      hasDestination: !!destinationUrl,
      ipHashPrefix: ipHash.slice(0, 8),
    },
    "info"
  );

  return created(c, { id, status: "open" });
});

export { abuse };

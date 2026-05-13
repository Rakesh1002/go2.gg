/**
 * Dunning Workflow.
 *
 * Replaces the inline cron handler at `0 9 * * *` with a durable Workflow.
 * Each per-record action (queue email, mark reminder sent, cancel Stripe
 * subscription) is its own `step.do` so a mid-run failure resumes from the
 * last completed step instead of replaying the whole batch — which is the
 * whole reason this exists: dunning emails are user-visible and idempotency-
 * sensitive, and the previous "loop in waitUntil" path could double-send
 * if the Worker died after queueing but before marking the reminder sent.
 *
 * Triggered from `index.ts` scheduled handler:
 *   await env.DUNNING_WORKFLOW.create({ params: { triggeredAt } });
 */

import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";
import {
  getPendingDunningReminders,
  markReminderSent,
  buildDunningEmailData,
  getExpiredDunningRecords,
  markDunningCanceled,
  DUNNING_SCHEDULE,
  type DunningRecord,
} from "../lib/dunning.js";
import { logEvent, logError } from "../lib/axiom.js";

export interface DunningWorkflowParams {
  triggeredAt: string;
}

export class DunningWorkflow extends WorkflowEntrypoint<Env, DunningWorkflowParams> {
  override async run(event: WorkflowEvent<DunningWorkflowParams>, step: WorkflowStep) {
    const env = this.env;
    const db = drizzle(env.DB, { schema });

    const pending = await step.do("fetch-pending-reminders", async () => {
      return getPendingDunningReminders(db);
    });

    let remindersSent = 0;
    for (const record of pending) {
      const reminderDay = pickReminderDay(record);
      const stepKey = `reminder:${record.id}:day-${reminderDay}`;

      // Queue the email and mark sent in a single durable step so the
      // pair commits or retries together. The DB write is the source of
      // truth — if the queue.send succeeds but markReminderSent fails,
      // the next workflow run will re-pick this record.
      await step.do(stepKey, async () => {
        if (!env.BACKGROUND_QUEUE) return;
        const emailData = buildDunningEmailData(
          record,
          reminderDay,
          `${env.APP_URL}/dashboard/billing`,
        );
        await env.BACKGROUND_QUEUE.send({
          type: "email:send",
          payload: {
            to: record.email,
            template: "dunning-reminder",
            data: { customerName: "Customer", ...emailData },
          },
        });
        await markReminderSent(db, record.id, reminderDay);
      });
      remindersSent += 1;
    }

    const expired = await step.do("fetch-expired-records", async () => {
      return getExpiredDunningRecords(db);
    });

    let canceled = 0;
    for (const record of expired) {
      try {
        await step.do(`cancel:${record.id}`, async () => {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-02-24.acacia",
          });
          const subs = await stripe.subscriptions.list({
            customer: record.stripeCustomerId,
            status: "past_due",
            limit: 1,
          });
          if (subs.data.length > 0) {
            await stripe.subscriptions.cancel(subs.data[0].id);
          }
          await markDunningCanceled(db, record.id);
        });
        canceled += 1;
      } catch (err) {
        await logError(env, "dunning: subscription cancel failed", {
          dunningId: record.id,
          stripeCustomerId: record.stripeCustomerId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await logEvent(env, "dunning: workflow complete", {
      triggeredAt: event.payload.triggeredAt,
      pending: pending.length,
      remindersSent,
      expired: expired.length,
      canceled,
    });

    return { remindersSent, canceled };
  }
}

function pickReminderDay(record: DunningRecord): number {
  const daysSinceFailure = Math.floor(
    (Date.now() - new Date(record.failedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceFailure >= DUNNING_SCHEDULE.FINAL_WARNING) return DUNNING_SCHEDULE.FINAL_WARNING;
  if (daysSinceFailure >= DUNNING_SCHEDULE.REMINDER_2) return DUNNING_SCHEDULE.REMINDER_2;
  return DUNNING_SCHEDULE.REMINDER_1;
}

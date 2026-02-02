/**
 * Dunning Service
 *
 * Handles failed payment sequences with automated reminders:
 * - Day 0: Initial payment failure email
 * - Day 3: First reminder
 * - Day 7: Urgent reminder
 * - Day 10: Final warning before cancellation
 *
 * Grace period: 10 days from first failure
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, lte, isNull } from "drizzle-orm";
import * as schema from "@repo/db";

// Dunning schedule configuration
export const DUNNING_SCHEDULE = {
  INITIAL: 0, // Day 0: Send immediately on failure
  REMINDER_1: 3, // Day 3: First reminder
  REMINDER_2: 7, // Day 7: Urgent reminder
  FINAL_WARNING: 10, // Day 10: Final warning
  GRACE_PERIOD: 10, // Days before cancellation
} as const;

export interface DunningRecord {
  id: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeInvoiceId: string;
  email: string;
  amount: number;
  currency: string;
  failedAt: string;
  lastReminderSent: number; // 0, 3, 7, or 10
  lastReminderSentAt: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  canceledAt: string | null;
}

/**
 * Create a new dunning record when payment fails
 */
export async function createDunningRecord(
  db: DrizzleD1Database<typeof schema>,
  data: {
    organizationId: string;
    stripeCustomerId: string;
    stripeInvoiceId: string;
    email: string;
    amount: number;
    currency: string;
  }
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.dunningRecords).values({
    id,
    organizationId: data.organizationId,
    stripeCustomerId: data.stripeCustomerId,
    stripeInvoiceId: data.stripeInvoiceId,
    email: data.email,
    amount: data.amount,
    currency: data.currency,
    failedAt: now,
    lastReminderSent: 0,
    lastReminderSentAt: now,
    resolved: false,
  });

  return id;
}

/**
 * Mark a dunning record as resolved (payment successful)
 */
export async function resolveDunning(
  db: DrizzleD1Database<typeof schema>,
  stripeInvoiceId: string
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .update(schema.dunningRecords)
    .set({
      resolved: true,
      resolvedAt: now,
    })
    .where(eq(schema.dunningRecords.stripeInvoiceId, stripeInvoiceId));
}

/**
 * Get dunning records that need reminders sent
 */
export async function getPendingDunningReminders(
  db: DrizzleD1Database<typeof schema>
): Promise<DunningRecord[]> {
  const now = new Date();

  // Get all unresolved dunning records
  const records = await db
    .select()
    .from(schema.dunningRecords)
    .where(
      and(eq(schema.dunningRecords.resolved, false), isNull(schema.dunningRecords.canceledAt))
    );

  // Filter to records that need reminders
  return records.filter((record) => {
    const failedAt = new Date(record.failedAt);
    const daysSinceFailure = Math.floor(
      (now.getTime() - failedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which reminder should be sent next
    const nextReminderDay = getNextReminderDay(record.lastReminderSent);

    // Check if enough time has passed for the next reminder
    return daysSinceFailure >= nextReminderDay && record.lastReminderSent < nextReminderDay;
  }) as DunningRecord[];
}

/**
 * Get dunning records that have passed the grace period
 */
export async function getExpiredDunningRecords(
  db: DrizzleD1Database<typeof schema>
): Promise<DunningRecord[]> {
  const now = new Date();
  const gracePeriodCutoff = new Date(
    now.getTime() - DUNNING_SCHEDULE.GRACE_PERIOD * 24 * 60 * 60 * 1000
  );

  const records = await db
    .select()
    .from(schema.dunningRecords)
    .where(
      and(
        eq(schema.dunningRecords.resolved, false),
        isNull(schema.dunningRecords.canceledAt),
        lte(schema.dunningRecords.failedAt, gracePeriodCutoff.toISOString())
      )
    );

  return records as DunningRecord[];
}

/**
 * Update dunning record after sending a reminder
 */
export async function markReminderSent(
  db: DrizzleD1Database<typeof schema>,
  dunningId: string,
  reminderDay: number
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .update(schema.dunningRecords)
    .set({
      lastReminderSent: reminderDay,
      lastReminderSentAt: now,
    })
    .where(eq(schema.dunningRecords.id, dunningId));
}

/**
 * Mark dunning record as canceled (subscription was canceled due to non-payment)
 */
export async function markDunningCanceled(
  db: DrizzleD1Database<typeof schema>,
  dunningId: string
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .update(schema.dunningRecords)
    .set({
      canceledAt: now,
    })
    .where(eq(schema.dunningRecords.id, dunningId));
}

/**
 * Get the next reminder day based on the last reminder sent
 */
function getNextReminderDay(lastReminderSent: number): number {
  switch (lastReminderSent) {
    case 0:
      return DUNNING_SCHEDULE.REMINDER_1;
    case 3:
      return DUNNING_SCHEDULE.REMINDER_2;
    case 7:
      return DUNNING_SCHEDULE.FINAL_WARNING;
    default:
      return DUNNING_SCHEDULE.FINAL_WARNING + 1; // No more reminders
  }
}

/**
 * Calculate grace period end date
 */
export function getGracePeriodEndDate(failedAt: string): string {
  const failed = new Date(failedAt);
  const endDate = new Date(failed.getTime() + DUNNING_SCHEDULE.GRACE_PERIOD * 24 * 60 * 60 * 1000);
  return endDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Build email data for a dunning reminder
 */
export function buildDunningEmailData(
  record: DunningRecord,
  reminderDay: number,
  updatePaymentUrl: string
) {
  const daysSinceFailure = Math.floor(
    (Date.now() - new Date(record.failedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    amount: (record.amount / 100).toFixed(2),
    currency: record.currency.toUpperCase(),
    updatePaymentUrl,
    daysOverdue: daysSinceFailure,
    gracePeriodEnds: getGracePeriodEndDate(record.failedAt),
    willBeCanceled: reminderDay >= DUNNING_SCHEDULE.FINAL_WARNING,
  };
}

/**
 * Email Sending Utility
 *
 * Sends transactional + marketing email via Cloudflare's Email Sending Service.
 * Domain go2.gg is verified in the CF dashboard, so we can deliver to any
 * recipient. Templates are React Email components rendered to HTML+text.
 *
 * @see https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 */

import { render } from "@react-email/render";
import type { Env, CFEmailMessage } from "../bindings.js";
import { logEvent } from "./axiom.js";

// Template imports
import {
  WelcomeEmail,
  MagicLinkEmail,
  PasswordResetEmail,
  OrganizationInviteEmail,
  InvoiceEmail,
  PaymentFailedEmail,
  PurchaseConfirmationEmail,
  SubscriptionUpdateEmail,
  SubscriptionCanceledEmail,
  DunningReminderEmail,
  UsageAlertEmail,
  BrokenLinkAlertEmail,
  GithubAccessGrantedEmail,
  ContactFormEmail,
  WaitlistConfirmationEmail,
  EmailVerificationEmail,
  EmailOTPEmail,
  // Drip campaign templates
  DripWelcomeEmail,
  DripFirstLinkEmail,
  DripFeaturesEmail,
  DripCustomDomainEmail,
  DripReengagementEmail,
  DripUpgradeEmail,
  // Affiliate program
  AffiliateApprovedEmail,
  AffiliateCommissionEarnedEmail,
  AffiliatePayoutSentEmail,
  // Trust & safety
  LinkDisabledForSafetyEmail,
  AbuseReportEmail,
  PhishingWarningEmail,
} from "@repo/email";

/**
 * Email payload structure for the queue
 */
export interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  /** Optional: Override the default subject */
  subject?: string;
  /** Optional: Force marketing sender (rakesh@go2.gg) */
  isMarketing?: boolean;
}

/**
 * Available email templates
 */
export type EmailTemplate =
  | "welcome"
  | "magic-link"
  | "password-reset"
  | "organization-invite"
  | "invoice"
  | "payment-failed"
  | "purchase-confirmation"
  | "subscription-update"
  | "subscription-canceled"
  | "dunning-reminder"
  | "usage-alert"
  | "broken-link-alert"
  | "github-access-granted"
  | "contact-form"
  | "waitlist-confirmation"
  | "trial-expiring"
  // Email auth templates
  | "email-verification"
  | "email-otp"
  // Drip campaign templates
  | "drip-welcome"
  | "drip-first-link"
  | "drip-features"
  | "drip-custom-domain"
  | "drip-reengagement"
  | "drip-upgrade"
  // Affiliate program
  | "affiliate-approved"
  | "affiliate-commission-earned"
  | "affiliate-payout-sent"
  // Trust & safety
  | "link-disabled-for-safety"
  | "abuse-report"
  | "phishing-warning";

/**
 * Default email subjects for each template
 */
const EMAIL_SUBJECTS: Record<EmailTemplate, string> = {
  welcome: "Welcome to Go2!",
  "magic-link": "Your login link for Go2",
  "password-reset": "Reset your Go2 password",
  "organization-invite": "You've been invited to join a team on Go2",
  invoice: "Your Go2 invoice",
  "payment-failed": "Action required: Payment failed",
  "purchase-confirmation": "Your Go2 purchase confirmation",
  "subscription-update": "Your Go2 subscription has been updated",
  "subscription-canceled": "Your Go2 subscription has been canceled",
  "dunning-reminder": "Action required: Update your payment method",
  "usage-alert": "Go2 usage alert",
  "broken-link-alert": "Broken links detected in your Go2 account",
  "github-access-granted": "GitHub access granted for Go2",
  "contact-form": "New contact form submission",
  "waitlist-confirmation": "You're on the Go2 waitlist!",
  "trial-expiring": "Your Go2 trial is expiring soon",
  // Email auth subjects
  "email-verification": "Verify your email address",
  "email-otp": "Your Go2 verification code",
  // Drip campaign subjects (can be overridden)
  "drip-welcome": "Welcome to Go2 - Let's get started!",
  "drip-first-link": "Ready to create your first link?",
  "drip-features": "3 features you might not know about",
  "drip-custom-domain": "Why branded links get 34% more clicks",
  "drip-reengagement": "Quick check-in - everything okay?",
  "drip-upgrade": "You're making great progress!",
  // Affiliate program
  "affiliate-approved": "You're in the Go2 affiliate program",
  "affiliate-commission-earned": "You earned a commission from Go2",
  "affiliate-payout-sent": "Your Go2 affiliate payout is on its way",
  // Trust & safety
  "link-disabled-for-safety": "A Go2 link of yours was disabled for safety",
  "abuse-report": "New abuse report on go2.gg",
  "phishing-warning":
    "Action required: phishing detected on your Go2 link — recurrence will suspend your account",
};

/**
 * Marketing templates (sent from rakesh@go2.gg)
 */
const MARKETING_TEMPLATES: EmailTemplate[] = [
  "contact-form",
  "waitlist-confirmation",
  // Drip campaigns are marketing emails
  "drip-welcome",
  "drip-first-link",
  "drip-features",
  "drip-custom-domain",
  "drip-reengagement",
  "drip-upgrade",
];

/**
 * Render the appropriate React Email template
 */
function renderTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): React.ReactElement | null {
  switch (template) {
    case "welcome":
      return WelcomeEmail({
        name: (data.name as string) || (data.customerName as string) || "there",
        loginUrl: data.loginUrl as string | undefined,
      });

    case "magic-link":
      return MagicLinkEmail({
        magicLink: data.magicLink as string,
        expiresIn: data.expiresIn as string | undefined,
      });

    case "password-reset":
      return PasswordResetEmail({
        resetLink: (data.resetLink as string) || (data.resetUrl as string),
        expiresIn: data.expiresIn as string | undefined,
      });

    case "organization-invite":
      return OrganizationInviteEmail({
        inviterName: data.inviterName as string,
        organizationName: data.organizationName as string,
        inviteUrl: data.inviteUrl as string,
        role: data.role as string | undefined,
      });

    case "invoice":
      return InvoiceEmail({
        customerName: (data.customerName as string) || "Customer",
        invoiceNumber: data.invoiceNumber as string,
        amount: data.amount as string,
        currency: data.currency as string,
        invoiceUrl: data.invoiceUrl as string,
        items: (data.items as Array<{
          description: string;
          amount: string;
        }>) || [{ description: "Subscription", amount: data.amount as string }],
        dueDate: data.dueDate as string | undefined,
      });

    case "payment-failed":
      return PaymentFailedEmail({
        customerName: (data.customerName as string) || "Customer",
        invoiceNumber: data.invoiceNumber as string | undefined,
        amount: data.amount as string,
        currency: data.currency as string,
        updatePaymentUrl: data.updatePaymentUrl as string,
        reason: data.reason as string | undefined,
        retryDate: data.retryDate as string | undefined,
      });

    case "purchase-confirmation":
      return PurchaseConfirmationEmail({
        customerName: data.customerName as string | undefined,
        licenseName: data.licenseName as string,
        licenseId: data.licenseId as string,
        amount: (data.amount as string) || "$99",
        githubUsername: data.githubUsername as string | undefined,
        discordInvite: data.discordInvite as string | undefined,
        docsUrl: data.docsUrl as string | undefined,
      });

    case "subscription-update":
      return SubscriptionUpdateEmail({
        customerName: (data.customerName as string) || "Customer",
        updateType:
          (data.updateType as
            | "upgraded"
            | "downgraded"
            | "cancelled"
            | "reactivated"
            | "renewed") ||
          (data.changeType === "upgrade" ? "upgraded" : "downgraded"),
        planName: data.planName as string,
        effectiveDate: data.effectiveDate as string,
        billingUrl: (data.billingUrl as string) || "",
      });

    case "subscription-canceled":
      return SubscriptionCanceledEmail({
        customerName: (data.customerName as string) || "Customer",
        planName: (data.planName as string) || "Pro",
        endDate: data.endDate as string,
        reactivateUrl: (data.reactivateUrl as string) || "",
        feedbackUrl: data.feedbackUrl as string | undefined,
      });

    case "dunning-reminder":
      return DunningReminderEmail({
        customerName: (data.customerName as string) || "Customer",
        amount: data.amount as string,
        currency: data.currency as string,
        updatePaymentUrl: data.updatePaymentUrl as string,
        daysOverdue:
          (data.daysOverdue as number) ||
          (data.daysUntilCancellation as number) ||
          3,
        gracePeriodEnds: data.gracePeriodEnds as string,
        willBeCanceled: (data.willBeCanceled as boolean) || false,
      });

    case "usage-alert":
      return UsageAlertEmail({
        customerName: (data.customerName as string) || "Customer",
        usageType: data.usageType as
          | "links"
          | "linksThisMonth"
          | "domains"
          | "teamMembers",
        usagePercentage: data.usagePercentage as number,
        currentUsage: data.currentUsage as number,
        limit: data.limit as number,
        planName: (data.planName as string) || "Free",
        upgradeUrl: data.upgradeUrl as string,
      });

    case "broken-link-alert":
      return BrokenLinkAlertEmail({
        customerName: (data.customerName as string) || "Customer",
        brokenLinksCount: data.brokenLinksCount as number,
        links: data.links as Array<{
          shortUrl: string;
          destinationUrl: string;
          error: string;
        }>,
        dashboardUrl: data.dashboardUrl as string,
      });

    case "github-access-granted":
      return GithubAccessGrantedEmail({
        customerName: (data.customerName as string) || "Customer",
        githubUsername: data.githubUsername as string,
        licenseName: data.licenseName as string,
        repoUrl: data.repoUrl as string,
        docsUrl: (data.docsUrl as string) || "/docs",
        discordUrl: data.discordUrl as string | undefined,
      });

    case "contact-form":
      return ContactFormEmail({
        name: data.name as string,
        email: data.email as string,
        subject: data.subject as string,
        message: data.message as string,
        submittedAt: data.submittedAt as string | undefined,
      });

    case "waitlist-confirmation":
      return WaitlistConfirmationEmail({
        name: data.name as string | undefined,
        email: data.email as string,
      });

    case "trial-expiring":
      return SubscriptionUpdateEmail({
        customerName: (data.customerName as string) || "Customer",
        updateType: "downgraded",
        planName: "Trial",
        effectiveDate: data.expiryDate as string,
        billingUrl:
          (data.billingUrl as string) || (data.upgradeUrl as string) || "",
      });

    case "email-verification":
      return EmailVerificationEmail({
        verificationLink: data.verificationLink as string,
        expiresIn: (data.expiresIn as string) || "24 hours",
      });

    case "email-otp":
      return EmailOTPEmail({
        otp: data.otp as string,
        type:
          (data.type as "sign-in" | "email-verification" | "forget-password") ||
          "sign-in",
        expiresIn: (data.expiresIn as string) || "10 minutes",
      });

    case "drip-welcome":
      return DripWelcomeEmail({
        name: (data.name as string) || "there",
        dashboardUrl: data.dashboardUrl as string,
        docsUrl: data.docsUrl as string | undefined,
      });

    case "drip-first-link":
      return DripFirstLinkEmail({
        name: (data.name as string) || "there",
        dashboardUrl: data.dashboardUrl as string,
        hasCreatedLink: (data.linksCreated as number) > 0,
      });

    case "drip-features":
      return DripFeaturesEmail({
        name: (data.name as string) || "there",
        dashboardUrl: data.dashboardUrl as string,
        linksCreated: data.linksCreated as number | undefined,
      });

    case "drip-custom-domain":
      return DripCustomDomainEmail({
        name: (data.name as string) || "there",
        domainsUrl: data.domainsUrl as string,
        hasCustomDomain: data.hasCustomDomain as boolean | undefined,
      });

    case "drip-reengagement":
      return DripReengagementEmail({
        name: (data.name as string) || "there",
        dashboardUrl: data.dashboardUrl as string,
        daysSinceLastActivity: (data.daysSinceLastActivity as number) || 7,
      });

    case "drip-upgrade":
      return DripUpgradeEmail({
        name: (data.name as string) || "there",
        billingUrl: data.billingUrl as string,
        currentPlan: (data.currentPlan as string) || "Free",
        linksCreated: (data.linksCreated as number) || 0,
        linksLimit: (data.linksLimit as number) || 50,
        usagePercent: (data.usagePercent as number) || 80,
        recommendedPlan: (data.recommendedPlan as string) || "Pro",
      });

    case "affiliate-approved":
      return AffiliateApprovedEmail({
        name: (data.name as string) || "there",
        shareUrl: data.shareUrl as string,
        code: data.code as string,
        commissionPercent: (data.commissionPercent as number) || 40,
      });

    case "affiliate-commission-earned":
      return AffiliateCommissionEarnedEmail({
        name: (data.name as string) || "there",
        commissionAmount: data.commissionAmount as string,
        pendingTotal: data.pendingTotal as string,
        dashboardUrl: data.dashboardUrl as string | undefined,
      });

    case "affiliate-payout-sent":
      return AffiliatePayoutSentEmail({
        name: (data.name as string) || "there",
        amount: data.amount as string,
        paypalEmail: data.paypalEmail as string,
      });

    case "link-disabled-for-safety":
      return LinkDisabledForSafetyEmail({
        customerName: (data.customerName as string) || "Customer",
        shortUrl: data.shortUrl as string,
        destinationUrl: data.destinationUrl as string,
        reason: data.reason as string,
        dashboardUrl: data.dashboardUrl as string,
      });

    case "abuse-report":
      return AbuseReportEmail({
        reportId: data.reportId as string,
        shortUrl: data.shortUrl as string,
        destinationUrl: (data.destinationUrl as string | null) ?? null,
        reason: data.reason as string,
        notes: (data.notes as string) || "",
        reporterEmail: (data.reporterEmail as string) || "",
        adminUrl: data.adminUrl as string,
      });

    case "phishing-warning":
      return PhishingWarningEmail({
        customerName: (data.customerName as string) || "there",
        links: data.links as Array<{
          shortUrl: string;
          destinationUrl: string;
          createdAt: string;
        }>,
        reason: data.reason as string,
        appealUrl: (data.appealUrl as string) || "mailto:abuse@go2.gg",
      });

    default:
      console.warn(`Unknown email template: ${template}`);
      return null;
  }
}

/**
 * Errors from the CF Email binding that mean "this recipient will never
 * accept mail" — we add the address to email_suppressions and stop trying.
 * Soft errors (timeouts, 5xx, rate limits) are NOT in this list — those
 * stay retryable.
 */
const HARD_BOUNCE_PATTERNS: RegExp[] = [
  /not\s*found/i,
  /no\s*such\s*user/i,
  /invalid\s*recipient/i,
  /recipient\s*rejected/i,
  /address\s*rejected/i,
  /unrouteable\s*address/i,
  /mailbox\s*unavailable/i,
  /user\s*unknown/i,
  /domain\s*does\s*not\s*exist/i,
  /no\s*mx\s*record/i,
  /\b550\b/, // SMTP "no such user / mailbox unavailable"
  /\b553\b/, // SMTP "mailbox name not allowed"
  /EmailDeliveryNotFound/i,
];

function isHardBounce(errMsg: string): boolean {
  return HARD_BOUNCE_PATTERNS.some((p) => p.test(errMsg));
}

/**
 * Best-effort suppression-list check. Returns true if the recipient is
 * suppressed. Failures (DB hiccup, missing table) fail open — we'd rather
 * send a possible duplicate than drop a real send because of an unrelated
 * error.
 */
async function isSuppressed(env: Env, email: string): Promise<boolean> {
  if (!env.DB) return false;
  try {
    const row = await env.DB.prepare(
      "SELECT 1 FROM email_suppressions WHERE email = ?1 LIMIT 1",
    )
      .bind(email.toLowerCase().trim())
      .first();
    return row !== null;
  } catch {
    return false;
  }
}

/**
 * Upsert a row into email_suppressions when CF rejects a recipient.
 * Increments failure_count + advances last_seen_at on every retry.
 */
async function recordSuppression(
  env: Env,
  email: string,
  reason: "hard_bounce" | "invalid",
  source: string,
  errMsg: string,
): Promise<void> {
  if (!env.DB) return;
  const normalized = email.toLowerCase().trim();
  try {
    await env.DB.prepare(
      `INSERT INTO email_suppressions (email, reason, source, last_error)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(email) DO UPDATE SET
         reason = excluded.reason,
         source = excluded.source,
         last_error = excluded.last_error,
         failure_count = email_suppressions.failure_count + 1,
         last_seen_at = datetime('now')`,
    )
      .bind(normalized, reason, source, errMsg.slice(0, 500))
      .run();
    await logEvent(
      env,
      "email.suppression.recorded",
      { email: normalized, reason, source },
      "warn",
    );
  } catch (e) {
    console.warn(
      "[Email] Failed to record suppression:",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/**
 * Parse "Name <addr@domain>" into { email, name } for the CF binding.
 * Bare addresses are returned as-is.
 */
function parseFrom(raw: string): string | { email: string; name: string } {
  const match = raw.match(/^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    return { name: match[1].replace(/^"|"$/g, ""), email: match[2] };
  }
  return raw.trim();
}

/**
 * Send an email using Cloudflare's Email Sending binding.
 */
export async function sendEmail(
  env: Env,
  payload: EmailPayload,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    console.error(
      "[Email] EMAIL binding is not configured. Add a [[send_email]] block to wrangler.toml.",
    );
    return { success: false, error: "Email service not configured" };
  }

  if (await isSuppressed(env, payload.to)) {
    await logEvent(
      env,
      "email.send.suppressed",
      { to: payload.to.toLowerCase().trim(), template: payload.template },
      "info",
    );
    return { success: false, error: "Recipient is suppressed" };
  }

  // Determine sender address
  const isMarketing =
    payload.isMarketing || MARKETING_TEMPLATES.includes(payload.template);
  const fromRaw = isMarketing
    ? env.EMAIL_FROM_MARKETING || "Rakesh <rakesh@go2.gg>"
    : env.EMAIL_FROM_TRANSACTIONAL || "Go2 <noreply@go2.gg>";
  const from = parseFrom(fromRaw);

  // Get subject
  const baseSubject =
    payload.subject || EMAIL_SUBJECTS[payload.template] || "Message from Go2";

  try {
    // Render React Email template to HTML + text
    const reactElement = renderTemplate(payload.template, payload.data);

    if (!reactElement) {
      console.warn(`Could not render template: ${payload.template}`);
      return {
        success: false,
        error: `Template not found: ${payload.template}`,
      };
    }

    const [html, text] = await Promise.all([
      render(reactElement, { pretty: false }),
      render(reactElement, { plainText: true }),
    ]);

    // Add replyTo for contact form emails
    const replyTo =
      payload.template === "contact-form"
        ? (payload.data.email as string)
        : undefined;

    // Custom subject for contact form
    const subject =
      payload.template === "contact-form"
        ? `[Contact Form] ${payload.data.subject as string}`
        : baseSubject;

    const message: CFEmailMessage = {
      to: payload.to,
      from,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
    };

    const result = await env.EMAIL.send(message);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Email] Failed to send ${payload.template}:`, errMsg);

    if (isHardBounce(errMsg)) {
      await recordSuppression(
        env,
        payload.to,
        "hard_bounce",
        payload.template,
        errMsg,
      );
    }

    return {
      success: false,
      error: errMsg,
    };
  }
}

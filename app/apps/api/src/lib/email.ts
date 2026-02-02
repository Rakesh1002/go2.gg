/**
 * Email Sending Utility
 *
 * Handles sending emails via Resend with React Email templates.
 */

import { Resend } from "resend";
import type { Env } from "../bindings.js";

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
  | "drip-upgrade";

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
      // Use subscription update template for trial expiry
      return SubscriptionUpdateEmail({
        customerName: (data.customerName as string) || "Customer",
        updateType: "downgraded",
        planName: "Trial",
        effectiveDate: data.expiryDate as string,
        billingUrl:
          (data.billingUrl as string) || (data.upgradeUrl as string) || "",
      });

    // Email auth templates
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

    // Drip campaign templates
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

    default:
      console.warn(`Unknown email template: ${template}`);
      return null;
  }
}

/**
 * Send an email using Resend
 */
export async function sendEmail(
  env: Env,
  payload: EmailPayload,
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(env.RESEND_API_KEY);

  // Determine sender address
  const isMarketing =
    payload.isMarketing || MARKETING_TEMPLATES.includes(payload.template);
  const from = isMarketing
    ? env.EMAIL_FROM_MARKETING || "Rakesh <rakesh@go2.gg>"
    : env.EMAIL_FROM_TRANSACTIONAL || "Go2 <noreply@go2.gg>";

  // Get subject
  const subject =
    payload.subject || EMAIL_SUBJECTS[payload.template] || "Message from Go2";

  try {
    // Render React Email template
    const reactElement = renderTemplate(payload.template, payload.data);

    if (!reactElement) {
      console.warn(`Could not render template: ${payload.template}`);
      return {
        success: false,
        error: `Template not found: ${payload.template}`,
      };
    }

    // Add replyTo for contact form emails
    const replyTo =
      payload.template === "contact-form"
        ? (payload.data.email as string)
        : undefined;

    // Custom subject for contact form
    const finalSubject =
      payload.template === "contact-form"
        ? `[Contact Form] ${payload.data.subject as string}`
        : subject;

    await resend.emails.send({
      from,
      to: payload.to,
      subject: finalSubject,
      react: reactElement,
      ...(replyTo && { replyTo }),
    });

    console.log(
      `Email sent successfully: ${payload.template} to ${payload.to}`,
    );
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email (${payload.template}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

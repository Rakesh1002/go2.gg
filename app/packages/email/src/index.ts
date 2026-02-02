/**
 * @repo/email - Email Templates Package
 *
 * React Email templates for transactional emails.
 */

// Templates
export { WelcomeEmail } from "./templates/welcome.js";
export { MagicLinkEmail } from "./templates/magic-link.js";
export { PasswordResetEmail } from "./templates/password-reset.js";
export { InvoiceEmail } from "./templates/invoice.js";
export { OrganizationInviteEmail } from "./templates/organization-invite.js";
export { SubscriptionUpdateEmail } from "./templates/subscription-update.js";
export { SubscriptionCanceledEmail } from "./templates/subscription-canceled.js";
export { PurchaseConfirmationEmail } from "./templates/purchase-confirmation.js";
export { PaymentFailedEmail } from "./templates/payment-failed.js";
export { DunningReminderEmail } from "./templates/dunning-reminder.js";
export { UsageAlertEmail } from "./templates/usage-alert.js";
export { BrokenLinkAlertEmail } from "./templates/broken-link-alert.js";
export { GithubAccessGrantedEmail } from "./templates/github-access-granted.js";
export { ContactFormEmail } from "./templates/contact-form.js";
export { SupportTicketEmail } from "./templates/support-ticket.js";
export { WaitlistConfirmationEmail } from "./templates/waitlist-confirmation.js";
export { EmailVerificationEmail } from "./templates/email-verification.js";
export { EmailOTPEmail } from "./templates/email-otp.js";

// Drip Campaign Templates
export { DripWelcomeEmail } from "./templates/drip-welcome.js";
export { DripFirstLinkEmail } from "./templates/drip-first-link.js";
export { DripFeaturesEmail } from "./templates/drip-features.js";
export { DripCustomDomainEmail } from "./templates/drip-custom-domain.js";
export { DripReengagementEmail } from "./templates/drip-reengagement.js";
export { DripUpgradeEmail } from "./templates/drip-upgrade.js";

// Components
export { EmailLayout } from "./components/layout.js";

// Config
export { emailConfig } from "./config.js";

// Types
export type { EmailConfig } from "./config.js";

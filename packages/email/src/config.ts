/**
 * Email Configuration
 *
 * Centralized config for email templates.
 * Hardcoded values for Go2 branding (email package runs on worker/server).
 */

export interface EmailConfig {
  /** Product/company name */
  productName: string;
  /** Company name */
  companyName: string;
  /** Support email */
  supportEmail: string;
  /** Marketing site URL */
  siteUrl: string;
  /** Logo URL */
  logoUrl: string;
  /** Primary brand color */
  primaryColor: string;
  /** Social links */
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

export const emailConfig: EmailConfig = {
  // Go2 Branding
  productName: "Go2",
  companyName: "Go2",
  supportEmail: "support@go2.gg",
  siteUrl: "https://go2.gg",
  // Use the hosted logo on the CDN
  logoUrl: "https://go2.gg/logo.png",
  // Go2 brand color (teal/cyan)
  primaryColor: "#0d9488",
  social: {
    twitter: "https://x.com/buildwithrakesh",
    github: "https://github.com/rakesh1002/go2.gg",
  },
};

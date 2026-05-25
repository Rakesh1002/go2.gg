import { Button, Heading, Hr, Text } from "@react-email/components";
import type * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface LinkDisabledForSafetyEmailProps {
  customerName: string;
  shortUrl: string;
  destinationUrl: string;
  reason: string;
  dashboardUrl: string;
}

export function LinkDisabledForSafetyEmail({
  customerName = "Customer",
  shortUrl,
  destinationUrl,
  reason,
  dashboardUrl,
}: LinkDisabledForSafetyEmailProps) {
  return (
    <EmailLayout preview="One of your Go2 links was disabled for safety reasons">
      <Heading style={heading}>A link was disabled</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        We disabled one of your Go2 short links because its destination was flagged as harmful by
        Google Safe Browsing or Cloudflare URL Scanner. Visitors clicking the short URL now see a
        410 Gone page instead of being redirected.
      </Text>

      <div style={alertBox}>
        <Text style={alertLabel}>Short URL</Text>
        <Text style={alertValue}>{shortUrl}</Text>
        <Text style={alertLabel}>Destination</Text>
        <Text style={alertValue}>{destinationUrl}</Text>
        <Text style={alertLabel}>Flagged as</Text>
        <Text style={alertValue}>{reason}</Text>
      </div>

      <Text style={paragraph}>
        If you believe this is a false positive, reply to this email and we'll investigate.
        Otherwise, please review your other links — phishing destinations on a shortener domain can
        get the entire domain demoted in Google Search, so we err on the side of caution.
      </Text>

      <Button style={button} href={dashboardUrl}>
        Review your links
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Need to discuss? Reach us at abuse@go2.gg. We respond within 24 hours.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const alertBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "16px",
  margin: "16px 0",
  borderRadius: "6px",
};

const alertLabel: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "8px 0 2px",
};

const alertValue: React.CSSProperties = {
  color: "#7f1d1d",
  fontSize: "14px",
  wordBreak: "break-all" as const,
  margin: "0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: emailConfig.primaryColor,
  borderRadius: "6px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "24px 0",
};

const smallText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
};

export default LinkDisabledForSafetyEmail;

import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface AffiliateApprovedEmailProps {
  name?: string;
  shareUrl: string;
  code: string;
  commissionPercent?: number;
}

export function AffiliateApprovedEmail({
  name = "there",
  shareUrl,
  code,
  commissionPercent = 40,
}: AffiliateApprovedEmailProps) {
  return (
    <EmailLayout preview={`You're in the ${emailConfig.productName} affiliate program`}>
      <Heading style={heading}>You're in.</Heading>

      <Text style={paragraph}>Hi {name},</Text>

      <Text style={paragraph}>
        Welcome to the {emailConfig.productName} affiliate program. You're earning{" "}
        <strong>{commissionPercent}% recurring commission</strong> on every paid invoice from
        customers who sign up through your link — for the lifetime of their subscription.
      </Text>

      <Text style={label}>Your share link</Text>
      <Text style={code_}>{shareUrl}</Text>

      <Button style={button} href={shareUrl}>
        Open my dashboard
      </Button>

      <Text style={paragraph}>How it works:</Text>
      <Text style={listItem}>Cookie attribution lasts 30 days.</Text>
      <Text style={listItem}>Recurring — not just first month.</Text>
      <Text style={listItem}>
        Refunds reverse automatically. Payouts via PayPal on the 1st of every month for balances
        over $50.
      </Text>

      <Text style={paragraph}>
        Code: <code style={inlineCode}>{code}</code>
      </Text>

      <Text style={paragraph}>
        Reply to this email anytime — we read every one.
        <br />
        Rakesh
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#1f2937",
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

const label: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "20px 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const code_: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  color: "#111827",
  fontFamily: "monospace",
  fontSize: "14px",
  padding: "10px 12px",
  margin: "0 0 16px",
};

const inlineCode: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
  color: "#111827",
  fontFamily: "monospace",
  fontSize: "14px",
  padding: "2px 6px",
};

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "6px 0 6px 4px",
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
  margin: "16px 0 24px",
};

export default AffiliateApprovedEmail;

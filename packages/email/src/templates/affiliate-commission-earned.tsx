import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface AffiliateCommissionEarnedEmailProps {
  name?: string;
  commissionAmount: string;
  pendingTotal: string;
  dashboardUrl?: string;
}

export function AffiliateCommissionEarnedEmail({
  name = "there",
  commissionAmount,
  pendingTotal,
  dashboardUrl = `${emailConfig.siteUrl}/dashboard/affiliates`,
}: AffiliateCommissionEarnedEmailProps) {
  return (
    <EmailLayout
      preview={`You earned ${commissionAmount} from a referral`}
    >
      <Heading style={heading}>You just earned {commissionAmount}.</Heading>

      <Text style={paragraph}>Hi {name},</Text>

      <Text style={paragraph}>
        One of your referred customers just paid an invoice. <strong>{commissionAmount}</strong>{" "}
        was added to your pending balance.
      </Text>

      <Text style={paragraph}>
        Your pending balance is now <strong>{pendingTotal}</strong>. We pay out via PayPal on the
        1st of every month for balances over $50.
      </Text>

      <Button style={button} href={dashboardUrl}>
        View your dashboard
      </Button>

      <Text style={paragraph}>
        Keep sharing —
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

export default AffiliateCommissionEarnedEmail;

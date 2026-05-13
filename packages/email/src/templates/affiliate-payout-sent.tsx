import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface AffiliatePayoutSentEmailProps {
  name?: string;
  amount: string;
  paypalEmail: string;
}

export function AffiliatePayoutSentEmail({
  name = "there",
  amount,
  paypalEmail,
}: AffiliatePayoutSentEmailProps) {
  return (
    <EmailLayout preview={`Your ${emailConfig.productName} payout of ${amount} is on its way`}>
      <Heading style={heading}>Your payout is on its way.</Heading>

      <Text style={paragraph}>Hi {name},</Text>

      <Text style={paragraph}>
        We just sent <strong>{amount}</strong> to your PayPal at{" "}
        <strong>{paypalEmail}</strong>. It usually arrives within an hour.
      </Text>

      <Text style={paragraph}>
        Thanks for sharing {emailConfig.productName}. Keep going —
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

export default AffiliatePayoutSentEmail;

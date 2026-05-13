import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface SubscriptionCanceledEmailProps {
  customerName: string;
  planName: string;
  endDate: string;
  reactivateUrl: string;
  feedbackUrl?: string;
}

export function SubscriptionCanceledEmail({
  customerName = "Customer",
  planName = "Pro Plan",
  endDate = "January 31, 2026",
  reactivateUrl,
  feedbackUrl,
}: SubscriptionCanceledEmailProps) {
  return (
    <EmailLayout preview={`Your ${planName} subscription has been canceled`}>
      <Heading style={heading}>Subscription Canceled</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        We've received your request to cancel your <strong>{planName}</strong> subscription.
      </Text>

      <div style={infoBox}>
        <Text style={infoText}>
          <strong>What happens next:</strong>
        </Text>
        <Text style={infoText}>
          • Your subscription will remain active until <strong>{endDate}</strong>
        </Text>
        <Text style={infoText}>• You'll continue to have access to all features until then</Text>
        <Text style={infoText}>
          • After {endDate}, your account will be downgraded to the Free plan
        </Text>
      </div>

      <Text style={paragraph}>
        Changed your mind? You can reactivate your subscription anytime before {endDate}.
      </Text>

      <Button style={button} href={reactivateUrl}>
        Reactivate Subscription
      </Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        We're sorry to see you go. If there's anything we could have done better, we'd love to hear
        from you.
      </Text>

      {feedbackUrl && (
        <Button style={secondaryButton} href={feedbackUrl}>
          Share Feedback
        </Button>
      )}

      <Text style={smallText}>
        If you have any questions or need help with your account, please don't hesitate to reach out
        to our support team.
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

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const infoBox: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const infoText: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
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

const secondaryButton: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  color: "#374151",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "500",
  padding: "10px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "16px 0",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "16px 0",
};

export default SubscriptionCanceledEmail;

import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

type UpdateType = "upgraded" | "downgraded" | "cancelled" | "reactivated" | "renewed";

interface SubscriptionUpdateEmailProps {
  customerName: string;
  updateType: UpdateType;
  planName: string;
  effectiveDate: string;
  billingUrl: string;
}

const messages: Record<UpdateType, { subject: string; body: string }> = {
  upgraded: {
    subject: "Your subscription has been upgraded",
    body: "Great news! Your subscription has been upgraded. You now have access to all the features in your new plan.",
  },
  downgraded: {
    subject: "Your subscription has been changed",
    body: "Your subscription has been changed. Your new plan will take effect at the end of your current billing period.",
  },
  cancelled: {
    subject: "Your subscription has been cancelled",
    body: "We're sorry to see you go. Your subscription has been cancelled and will remain active until the end of your current billing period.",
  },
  reactivated: {
    subject: "Welcome back! Your subscription is active",
    body: "Great to have you back! Your subscription has been reactivated and you now have full access to all features.",
  },
  renewed: {
    subject: "Your subscription has been renewed",
    body: "Your subscription has been successfully renewed. Thank you for your continued support!",
  },
};

export function SubscriptionUpdateEmail({
  customerName = "Customer",
  updateType = "upgraded",
  planName = "Pro",
  effectiveDate,
  billingUrl,
}: SubscriptionUpdateEmailProps) {
  const { subject, body } = messages[updateType];

  return (
    <EmailLayout preview={subject}>
      <Heading style={heading}>{subject}</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>{body}</Text>

      <Text style={details}>
        <strong>Plan:</strong> {planName}
        <br />
        <strong>Effective date:</strong> {effectiveDate}
      </Text>

      <Button style={button} href={billingUrl}>
        Manage Subscription
      </Button>

      <Text style={paragraph}>
        If you have any questions about your subscription, please don't hesitate to contact us.
      </Text>

      <Text style={paragraph}>
        Best,
        <br />
        The {emailConfig.productName} Team
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

const details: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "16px",
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

export default SubscriptionUpdateEmail;

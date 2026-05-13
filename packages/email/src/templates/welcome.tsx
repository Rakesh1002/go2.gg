import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  name = "there",
  loginUrl = `${emailConfig.siteUrl}/login`,
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${emailConfig.productName}!`}>
      <Heading style={heading}>Welcome to {emailConfig.productName}!</Heading>

      <Text style={paragraph}>Hi {name},</Text>

      <Text style={paragraph}>
        Thanks for signing up for {emailConfig.productName}. We're excited to have you on board!
      </Text>

      <Text style={paragraph}>Here's what you can do next:</Text>

      <Text style={listItem}>✅ Set up your profile</Text>
      <Text style={listItem}>✅ Explore the dashboard</Text>
      <Text style={listItem}>✅ Invite your team members</Text>

      <Button style={button} href={loginUrl}>
        Go to Dashboard
      </Button>

      <Text style={paragraph}>
        If you have any questions, just reply to this email — we're always happy to help!
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

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
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

export default WelcomeEmail;

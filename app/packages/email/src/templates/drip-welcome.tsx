import { Button, Heading, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripWelcomeEmailProps {
  name: string;
  dashboardUrl: string;
  docsUrl?: string;
}

export function DripWelcomeEmail({
  name = "there",
  dashboardUrl = "/dashboard",
  docsUrl = "/docs",
}: DripWelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${emailConfig.productName} - Let's get started!`}>
      <Heading style={heading}>Welcome to {emailConfig.productName}! 🎉</Heading>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Thanks for joining {emailConfig.productName}! You've just taken the first step toward
        smarter, faster link management.
      </Text>

      <Text style={paragraph}>
        <strong>Here's what makes {emailConfig.productName} special:</strong>
      </Text>

      <div style={featureList}>
        <Text style={featureItem}>⚡ <strong>Edge-powered speed</strong> - Links that load in milliseconds, anywhere in the world</Text>
        <Text style={featureItem}>📊 <strong>Real-time analytics</strong> - See who clicks, when, and where</Text>
        <Text style={featureItem}>🎯 <strong>Smart targeting</strong> - Route visitors based on location, device, and more</Text>
        <Text style={featureItem}>🔗 <strong>Custom domains</strong> - Use your own brand for maximum trust</Text>
      </div>

      <Button style={button} href={dashboardUrl}>
        Create Your First Link →
      </Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        <strong>Need help getting started?</strong>
      </Text>

      <Text style={paragraph}>
        Check out our{" "}
        <Link href={docsUrl} style={link}>
          quick start guide
        </Link>{" "}
        or just reply to this email - I read every message and love helping new users succeed!
      </Text>

      <Text style={signature}>
        Cheers,
        <br />
        Rakesh
        <br />
        <span style={signatureTitle}>Founder, {emailConfig.productName}</span>
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
  lineHeight: "26px",
  margin: "16px 0",
};

const featureList: React.CSSProperties = {
  margin: "24px 0",
};

const featureItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "8px 0",
};

const button: React.CSSProperties = {
  backgroundColor: emailConfig.primaryColor,
  borderRadius: "6px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "24px 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const link: React.CSSProperties = {
  color: emailConfig.primaryColor,
  textDecoration: "underline",
};

const signature: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0 0",
};

const signatureTitle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
};

export default DripWelcomeEmail;

import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface MagicLinkEmailProps {
  magicLink: string;
  expiresIn?: string;
}

export function MagicLinkEmail({ magicLink, expiresIn = "10 minutes" }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={`Your sign-in link for ${emailConfig.productName}`}>
      <Heading style={heading}>Sign in to {emailConfig.productName}</Heading>

      <Text style={paragraph}>
        Click the button below to sign in to your account. This link will expire in {expiresIn}.
      </Text>

      <Button style={button} href={magicLink}>
        Sign in to {emailConfig.productName}
      </Button>

      <Text style={paragraph}>If you didn't request this email, you can safely ignore it.</Text>

      <Text style={smallText}>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        {magicLink}
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

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "24px 0 0",
  wordBreak: "break-all" as const,
};

export default MagicLinkEmail;

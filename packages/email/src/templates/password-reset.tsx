import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface PasswordResetEmailProps {
  resetLink: string;
  expiresIn?: string;
}

export function PasswordResetEmail({ resetLink, expiresIn = "1 hour" }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview={`Reset your ${emailConfig.productName} password`}>
      <Heading style={heading}>Reset your password</Heading>

      <Text style={paragraph}>
        We received a request to reset your password. Click the button below to choose a new
        password.
      </Text>

      <Button style={button} href={resetLink}>
        Reset Password
      </Button>

      <Text style={paragraph}>
        This link will expire in {expiresIn}. If you didn't request a password reset, you can safely
        ignore this email.
      </Text>

      <Text style={smallText}>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        {resetLink}
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

export default PasswordResetEmail;

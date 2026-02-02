import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

type OTPType = "sign-in" | "email-verification" | "forget-password";

interface EmailOTPProps {
  otp: string;
  type: OTPType;
  expiresIn?: string;
}

const titles: Record<OTPType, string> = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
};

const descriptions: Record<OTPType, string> = {
  "sign-in": "Enter this code to sign in to your account:",
  "email-verification": "Enter this code to verify your email address:",
  "forget-password": "Enter this code to reset your password:",
};

export function EmailOTPEmail({
  otp,
  type,
  expiresIn = "10 minutes",
}: EmailOTPProps) {
  return (
    <EmailLayout
      preview={`Your ${emailConfig.productName} verification code: ${otp}`}
    >
      <Heading style={heading}>{titles[type]}</Heading>

      <Text style={paragraph}>{descriptions[type]}</Text>

      <Section style={codeContainer}>
        <Text style={codeText}>{otp}</Text>
      </Section>

      <Text style={paragraph}>
        This code will expire in {expiresIn}. If you didn't request this code,
        you can safely ignore this email.
      </Text>

      <Text style={smallText}>
        Don't share this code with anyone. Our team will never ask for your
        code.
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

const codeContainer: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeText: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "24px 0 0",
};

export default EmailOTPEmail;

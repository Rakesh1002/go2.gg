import { Heading, Hr, Text, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt?: string;
}

export function ContactFormEmail({
  name = "Someone",
  email = "someone@example.com",
  subject = "Contact Form Submission",
  message = "This is a test message.",
  submittedAt,
}: ContactFormEmailProps) {
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

  return (
    <EmailLayout preview={`New contact form: ${subject}`}>
      <Heading style={heading}>New Contact Form Submission</Heading>

      <div style={infoBox}>
        <Text style={infoLabel}>From</Text>
        <Text style={infoValue}>
          {name} (
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>
          )
        </Text>

        <Text style={infoLabel}>Subject</Text>
        <Text style={infoValue}>{subject}</Text>

        <Text style={infoLabel}>Received</Text>
        <Text style={infoValue}>{formattedDate}</Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>Message</Text>
      <div style={messageBox}>
        <Text style={messageText}>{message}</Text>
      </div>

      <Hr style={hr} />

      <Text style={replyNote}>
        Reply directly to this email to respond to{" "}
        <Link href={`mailto:${email}`} style={link}>
          {email}
        </Link>
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

const infoBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const infoLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const infoValue: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  margin: "0 0 16px",
};

const link: React.CSSProperties = {
  color: "#6366f1",
  textDecoration: "none",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const sectionTitle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const messageBox: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
};

const messageText: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const replyNote: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  fontStyle: "italic",
};

export default ContactFormEmail;

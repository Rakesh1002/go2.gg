import { Heading, Hr, Text, Link, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";

interface SupportTicketEmailProps {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  submittedAt?: string;
}

const priorityColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#ef4444",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "🚨 URGENT",
};

const categoryLabels: Record<string, string> = {
  how_to: "How To",
  bug_report: "Bug Report",
  billing: "Billing",
  feature_request: "Feature Request",
  account: "Account",
  api: "API & Integrations",
  urgent: "Urgent",
  enterprise: "Enterprise",
  other: "Other",
};

export function SupportTicketEmail({
  ticketId = "ticket-123",
  name = "Someone",
  email = "someone@example.com",
  subject = "Support Request",
  message = "This is a test message.",
  category = "other",
  priority = "medium",
  submittedAt,
}: SupportTicketEmailProps) {
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

  const priorityColor = priorityColors[priority] || priorityColors.medium;
  const priorityLabel = priorityLabels[priority] || priority;
  const categoryLabel = categoryLabels[category] || category;

  return (
    <EmailLayout preview={`Support Ticket: ${subject}`}>
      <Section style={priorityBanner(priorityColor)}>
        <Text style={priorityText}>{priorityLabel} Priority</Text>
      </Section>

      <Heading style={heading}>New Support Ticket</Heading>

      <div style={infoBox}>
        <div style={infoRow}>
          <div style={infoColumn}>
            <Text style={infoLabel}>Ticket ID</Text>
            <Text style={infoValue}>{ticketId.slice(0, 8)}</Text>
          </div>
          <div style={infoColumn}>
            <Text style={infoLabel}>Category</Text>
            <Text style={infoValue}>{categoryLabel}</Text>
          </div>
        </div>

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
        <Text style={{ ...infoValue, marginBottom: 0 }}>{formattedDate}</Text>
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

const priorityBanner = (color: string): React.CSSProperties => ({
  backgroundColor: color,
  borderRadius: "8px 8px 0 0",
  padding: "8px 16px",
  marginBottom: "16px",
});

const priorityText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

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

const infoRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const infoColumn: React.CSSProperties = {
  flex: "1",
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

export default SupportTicketEmail;

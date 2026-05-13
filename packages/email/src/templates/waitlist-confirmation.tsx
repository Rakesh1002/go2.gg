import { Heading, Text, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface WaitlistConfirmationEmailProps {
  name?: string;
  email: string;
}

export function WaitlistConfirmationEmail({
  name,
  email = "you@example.com",
}: WaitlistConfirmationEmailProps) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  return (
    <EmailLayout preview={`You're on the ${emailConfig.productName} waitlist!`}>
      <Heading style={heading}>You're on the list!</Heading>

      <Text style={paragraph}>{greeting},</Text>

      <Text style={paragraph}>
        Thanks for joining the {emailConfig.productName} waitlist! We're thrilled to have you.
      </Text>

      <div style={highlightBox}>
        <Text style={highlightText}>
          You'll be among the first to know when we're ready to welcome new users.
        </Text>
      </div>

      <Text style={paragraph}>
        In the meantime, here's what you can expect from {emailConfig.productName}:
      </Text>

      <Text style={listItem}>⚡ Lightning-fast link shortening at the edge</Text>
      <Text style={listItem}>📊 Real-time analytics and click tracking</Text>
      <Text style={listItem}>🔗 Custom domains and branded short links</Text>
      <Text style={listItem}>🎯 Advanced targeting and A/B testing</Text>

      <Text style={paragraph}>
        Have questions? Just reply to this email - we'd love to hear from you!
      </Text>

      <Text style={paragraph}>
        Best,
        <br />
        The {emailConfig.productName} Team
      </Text>

      <Text style={footer}>
        This email was sent to{" "}
        <Link href={`mailto:${email}`} style={link}>
          {email}
        </Link>{" "}
        because you signed up for the {emailConfig.productName} waitlist.
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

const highlightBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #22c55e",
  padding: "12px 16px",
  margin: "24px 0",
  borderRadius: "0 6px 6px 0",
};

const highlightText: React.CSSProperties = {
  color: "#166534",
  fontSize: "16px",
  margin: "0",
};

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "32px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "16px",
};

const link: React.CSSProperties = {
  color: "#6366f1",
  textDecoration: "none",
};

export default WaitlistConfirmationEmail;

import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface OrganizationInviteEmailProps {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role?: string;
}

export function OrganizationInviteEmail({
  inviterName = "Someone",
  organizationName = "Organization",
  inviteUrl,
  role = "member",
}: OrganizationInviteEmailProps) {
  return (
    <EmailLayout preview={`You've been invited to join ${organizationName}`}>
      <Heading style={heading}>You're invited!</Heading>

      <Text style={paragraph}>
        <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong>{" "}
        on {emailConfig.productName} as a {role}.
      </Text>

      <Text style={paragraph}>
        Click the button below to accept the invitation and join the team.
      </Text>

      <Button style={button} href={inviteUrl}>
        Accept Invitation
      </Button>

      <Text style={paragraph}>
        This invitation will expire in 7 days. If you don't want to join, you can safely ignore this
        email.
      </Text>

      <Text style={smallText}>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        {inviteUrl}
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

export default OrganizationInviteEmail;

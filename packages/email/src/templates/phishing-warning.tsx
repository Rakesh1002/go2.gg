import { Button, Heading, Hr, Text } from "@react-email/components";
import type * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface PhishingWarningEmailProps {
  customerName: string;
  links: Array<{
    shortUrl: string;
    destinationUrl: string;
    createdAt: string;
  }>;
  reason: string;
  appealUrl: string;
}

export function PhishingWarningEmail({
  customerName = "there",
  links = [],
  reason,
  appealUrl,
}: PhishingWarningEmailProps) {
  const isPlural = links.length > 1;

  return (
    <EmailLayout
      preview={
        isPlural
          ? `${links.length} of your Go2 links were disabled for phishing / social engineering`
          : "Your Go2 link was disabled for phishing / social engineering"
      }
    >
      <Heading style={heading}>
        {isPlural ? "Multiple links disabled" : "Link disabled"} — action required
      </Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        We disabled {isPlural ? `${links.length} of your` : "a"} Go2 short link{isPlural ? "s" : ""}{" "}
        because the destination{isPlural ? "s" : ""} {isPlural ? "were" : "was"} detected as
        <strong> social engineering / phishing content </strong>
        by Google Safe Browsing and our internal review. The link{isPlural ? "s" : ""} now return
        410 Gone and {isPlural ? "are" : "is"} no longer reachable through go2.gg.
      </Text>

      {links.map((link, i) => (
        <div key={i} style={alertBox}>
          <Text style={alertLabel}>Short URL</Text>
          <Text style={alertValue}>{link.shortUrl}</Text>
          <Text style={alertLabel}>Destination</Text>
          <Text style={alertValue}>{link.destinationUrl}</Text>
          <Text style={alertLabel}>Created</Text>
          <Text style={alertValue}>{link.createdAt}</Text>
          <Text style={alertLabel}>Flagged as</Text>
          <Text style={alertValue}>{reason}</Text>
        </div>
      ))}

      <Hr style={hr} />

      <Heading as="h2" style={subheading}>
        Important: account-level consequences on recurrence
      </Heading>

      <Text style={paragraph}>
        Phishing destinations on a shortener domain cause the entire shortener to be demoted in
        Google Search and flagged in Chrome's Safe Browsing warnings — affecting every legitimate
        user. Because of that, the next time a link from your account is flagged for phishing,
        malware, social engineering, or impersonation,{" "}
        <strong>your Go2 account will be suspended</strong> pending review.
      </Text>

      <Text style={paragraph}>
        Acceptable-use details are at{" "}
        <a href="https://go2.gg/acceptable-use" style={inlineLink}>
          go2.gg/acceptable-use
        </a>
        . If you believe this is a false positive, reply to this email within 7 days with details
        and we'll investigate.
      </Text>

      <Button style={button} href={appealUrl}>
        Reply to appeal
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Reference: this is an automated notice from the Go2 Trust & Safety system. Replies go to{" "}
        <a href="mailto:abuse@go2.gg" style={inlineLink}>
          abuse@go2.gg
        </a>{" "}
        for human review.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const subheading: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "16px 0 8px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const alertBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "16px",
  margin: "16px 0",
  borderRadius: "6px",
};

const alertLabel: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "8px 0 2px",
};

const alertValue: React.CSSProperties = {
  color: "#7f1d1d",
  fontSize: "13px",
  wordBreak: "break-all" as const,
  margin: "0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
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
  margin: "16px 0",
};

const inlineLink: React.CSSProperties = {
  color: emailConfig.primaryColor,
  textDecoration: "underline",
};

const smallText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
};

export default PhishingWarningEmail;

import { Button, Heading, Hr, Text } from "@react-email/components";
import type * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

/**
 * Strike 1 and 2 of the behavioral abuse ladder.
 *
 * Deliberately NOT the phishing-warning template: that one asserts a Google
 * Safe Browsing phishing verdict, and Safe Browsing returns "clean" on this
 * entire class (bulk-email spam is not malware). Sending that copy to a user
 * who may be legitimate is a factually false accusation.
 *
 * The copy here is observational — it states what was measured and lets the
 * numbers carry the argument.
 */
interface AbuseStrikeWarningEmailProps {
  customerName: string;
  strikeNumber: number;
  strikesBeforeSuspension: number;
  links: Array<{
    shortUrl: string;
    destinationUrl: string;
    clicks: number;
    createdAt: string;
  }>;
  signalSummary: string;
  appealUrl: string;
}

export function AbuseStrikeWarningEmail({
  customerName = "there",
  strikeNumber = 1,
  strikesBeforeSuspension = 3,
  links = [],
  signalSummary = "",
  appealUrl = "mailto:abuse@go2.gg",
}: AbuseStrikeWarningEmailProps) {
  const isPlural = links.length > 1;
  const isFinal = strikeNumber >= strikesBeforeSuspension - 1;

  return (
    <EmailLayout
      preview={`${links.length} of your Go2 link${isPlural ? "s were" : " was"} disabled — unusual traffic pattern`}
    >
      <Heading style={heading}>
        {isFinal ? "Final warning" : "Action required"} — link
        {isPlural ? "s" : ""} disabled
      </Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        We disabled {isPlural ? `${links.length} of your` : "a"} Go2 short link
        {isPlural ? "s" : ""} after detecting click patterns consistent with{" "}
        <strong>bulk email sending and open-tracking</strong>. The link
        {isPlural ? "s" : ""} now return 410 Gone.
      </Text>

      {signalSummary ? (
        <div style={alertBox}>
          <Text style={alertLabel}>What we measured</Text>
          <Text style={alertValue}>{signalSummary}</Text>
        </div>
      ) : null}

      {links.map((link, i) => (
        <div key={i} style={alertBox}>
          <Text style={alertLabel}>Short URL</Text>
          <Text style={alertValue}>{link.shortUrl}</Text>
          <Text style={alertLabel}>Destination</Text>
          <Text style={alertValue}>{link.destinationUrl}</Text>
          <Text style={alertLabel}>Clicks recorded</Text>
          <Text style={alertValue}>{link.clicks.toLocaleString()}</Text>
          <Text style={alertLabel}>Created</Text>
          <Text style={alertValue}>{link.createdAt}</Text>
        </div>
      ))}

      <Hr style={hr} />

      <Heading as="h2" style={subheading}>
        This is warning {strikeNumber} of {strikesBeforeSuspension - 1}
      </Heading>

      <Text style={paragraph}>
        Using short links as tracking pixels in bulk email damages the reputation of the whole
        go2.gg domain, which affects every other user's deliverability. After{" "}
        {strikesBeforeSuspension} recorded incidents,{" "}
        <strong>your Go2 account will be suspended</strong> and all of your links disabled.
      </Text>

      <Text style={paragraph}>
        Acceptable-use details are at{" "}
        <a href="https://go2.gg/acceptable-use" style={inlineLink}>
          go2.gg/acceptable-use
        </a>
        . If you believe this is a mistake, reply within 7 days with details of your use case and
        we'll review it — including re-enabling the links if we got it wrong.
      </Text>

      <Button style={button} href={appealUrl}>
        Reply to appeal
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Automated notice from the Go2 Trust &amp; Safety system. Replies go to{" "}
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
};

const inlineLink: React.CSSProperties = {
  color: emailConfig.primaryColor,
  textDecoration: "underline",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "8px 0",
};

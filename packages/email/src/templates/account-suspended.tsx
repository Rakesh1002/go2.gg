import { Button, Heading, Hr, Text } from "@react-email/components";
import type * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

/**
 * Strike 3 — account suspended.
 *
 * Lists the prior warning dates deliberately: this is the document that has to
 * answer "you never told me" in an appeal, so the history is the point.
 */
interface AccountSuspendedEmailProps {
  customerName: string;
  strikeCount: number;
  priorStrikes: Array<{ date: string; signalSummary: string }>;
  linksDisabled: number;
  appealUrl: string;
}

export function AccountSuspendedEmail({
  customerName = "there",
  strikeCount = 3,
  priorStrikes = [],
  linksDisabled = 0,
  appealUrl = "mailto:abuse@go2.gg",
}: AccountSuspendedEmailProps) {
  return (
    <EmailLayout preview="Your Go2 account has been suspended">
      <Heading style={heading}>Your Go2 account has been suspended</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        Your Go2 account has been suspended after <strong>{strikeCount} recorded incidents</strong>{" "}
        of traffic consistent with bulk email sending and open-tracking. All{" "}
        {linksDisabled > 0 ? `${linksDisabled} of your links have` : "of your links have"} been
        disabled and now return 410 Gone. API keys and active sessions have been revoked.
      </Text>

      {priorStrikes.length > 0 ? (
        <>
          <Heading as="h2" style={subheading}>
            Incident history
          </Heading>
          {priorStrikes.map((strike, i) => (
            <div key={i} style={alertBox}>
              <Text style={alertLabel}>Date</Text>
              <Text style={alertValue}>{strike.date}</Text>
              <Text style={alertLabel}>Detected</Text>
              <Text style={alertValue}>{strike.signalSummary}</Text>
            </div>
          ))}
        </>
      ) : null}

      <Hr style={hr} />

      <Heading as="h2" style={subheading}>
        Appealing this decision
      </Heading>

      <Text style={paragraph}>
        If you believe this is a mistake, reply to this email with details of your use case. A human
        reviews every appeal, and we will reinstate the account and re-enable your links if the
        detection was wrong.
      </Text>

      <Text style={paragraph}>
        Acceptable-use details are at{" "}
        <a href="https://go2.gg/acceptable-use" style={inlineLink}>
          go2.gg/acceptable-use
        </a>
        .
      </Text>

      <Button style={button} href={appealUrl}>
        Appeal this suspension
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

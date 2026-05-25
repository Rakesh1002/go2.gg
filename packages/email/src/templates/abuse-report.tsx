import { Button, Heading, Hr, Text } from "@react-email/components";
import type * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface AbuseReportEmailProps {
  reportId: string;
  shortUrl: string;
  destinationUrl: string | null;
  reason: string;
  notes: string;
  reporterEmail: string;
  adminUrl: string;
}

export function AbuseReportEmail({
  reportId,
  shortUrl,
  destinationUrl,
  reason,
  notes,
  reporterEmail,
  adminUrl,
}: AbuseReportEmailProps) {
  return (
    <EmailLayout preview={`New abuse report: ${reason}`}>
      <Heading style={heading}>New abuse report</Heading>

      <Text style={paragraph}>A user submitted an abuse report for a go2.gg short link.</Text>

      <div style={box}>
        <Text style={label}>Short URL</Text>
        <Text style={value}>{shortUrl}</Text>

        {destinationUrl ? (
          <>
            <Text style={label}>Destination</Text>
            <Text style={value}>{destinationUrl}</Text>
          </>
        ) : (
          <Text style={label}>Destination: not in our DB</Text>
        )}

        <Text style={label}>Reason</Text>
        <Text style={value}>{reason}</Text>

        {notes ? (
          <>
            <Text style={label}>Notes</Text>
            <Text style={value}>{notes}</Text>
          </>
        ) : null}

        <Text style={label}>Reporter</Text>
        <Text style={value}>{reporterEmail || "anonymous"}</Text>
      </div>

      <Button style={button} href={adminUrl}>
        Open in admin queue
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Report ID: <code>{reportId}</code>. The link has been moved to the front of the daily rescan
        queue. Review and act if needed.
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

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const box: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px",
  margin: "16px 0",
  borderRadius: "6px",
};

const label: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "8px 0 2px",
};

const value: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
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
  margin: "24px 0",
};

const smallText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
};

export default AbuseReportEmail;

import { Button, Heading, Hr, Text, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface BrokenLinkAlertEmailProps {
  customerName: string;
  brokenLinksCount: number;
  links: Array<{
    shortUrl: string;
    destinationUrl: string;
    error: string;
  }>;
  dashboardUrl: string;
}

export function BrokenLinkAlertEmail({
  customerName = "Customer",
  brokenLinksCount = 1,
  links = [],
  dashboardUrl,
}: BrokenLinkAlertEmailProps) {
  const displayLinks = links.slice(0, 5); // Show max 5 links in email
  const hasMore = links.length > 5;

  return (
    <EmailLayout
      preview={`${brokenLinksCount} broken link${brokenLinksCount > 1 ? "s" : ""} detected`}
    >
      <Heading style={heading}>Broken Links Detected</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        Our link health monitoring has detected{" "}
        <strong>
          {brokenLinksCount} broken link{brokenLinksCount > 1 ? "s" : ""}
        </strong>{" "}
        in your account. These links are returning errors and may not be working for your visitors.
      </Text>

      <div style={alertBox}>
        <Text style={alertText}>
          <strong>
            {brokenLinksCount} link{brokenLinksCount > 1 ? "s" : ""}
          </strong>{" "}
          need
          {brokenLinksCount === 1 ? "s" : ""} your attention
        </Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>Affected Links:</Text>

      {displayLinks.map((link, index) => (
        <div key={index} style={linkCard}>
          <Text style={shortUrl}>
            <Link href={`https://${link.shortUrl}`} style={linkText}>
              {link.shortUrl}
            </Link>
          </Text>
          <Text style={destinationUrl}>→ {truncateUrl(link.destinationUrl)}</Text>
          <Text style={errorText}>Error: {link.error}</Text>
        </div>
      ))}

      {hasMore && (
        <Text style={moreText}>
          ...and {links.length - 5} more broken link{links.length - 5 > 1 ? "s" : ""}
        </Text>
      )}

      <Button style={button} href={dashboardUrl}>
        View All Links
      </Button>

      <Hr style={hr} />

      <Text style={smallTitle}>What you can do:</Text>
      <ul style={list}>
        <li style={listItem}>Check if the destination URLs are still active</li>
        <li style={listItem}>Update links to point to working URLs</li>
        <li style={listItem}>Archive links that are no longer needed</li>
      </ul>

      <Text style={smallText}>
        We'll automatically check these links again in 6 hours. You'll receive another notification
        if the issues persist.
      </Text>
    </EmailLayout>
  );
}

function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
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

const alertBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "12px 16px",
  margin: "16px 0",
};

const alertText: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "14px",
  margin: "0",
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

const linkCard: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "12px",
  marginBottom: "8px",
};

const shortUrl: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const linkText: React.CSSProperties = {
  color: emailConfig.primaryColor,
  textDecoration: "none",
};

const destinationUrl: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "4px 0 0",
  wordBreak: "break-all" as const,
};

const errorText: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "12px",
  margin: "4px 0 0",
};

const moreText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  fontStyle: "italic",
  margin: "8px 0 16px",
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

const smallTitle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const list: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0 16px 0",
  paddingLeft: "24px",
};

const listItem: React.CSSProperties = {
  margin: "4px 0",
};

const smallText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
};

export default BrokenLinkAlertEmail;

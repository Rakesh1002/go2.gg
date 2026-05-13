import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface UsageAlertEmailProps {
  customerName: string;
  usageType: "links" | "linksThisMonth" | "domains" | "teamMembers";
  usagePercentage: number;
  currentUsage: number;
  limit: number;
  planName: string;
  upgradeUrl: string;
}

const usageTypeLabels: Record<string, { name: string; singular: string }> = {
  links: { name: "total links", singular: "link" },
  linksThisMonth: { name: "monthly links", singular: "link" },
  domains: { name: "custom domains", singular: "domain" },
  teamMembers: { name: "team members", singular: "member" },
};

export function UsageAlertEmail({
  customerName = "Customer",
  usageType = "links",
  usagePercentage = 80,
  currentUsage = 80,
  limit = 100,
  planName = "Pro",
  upgradeUrl,
}: UsageAlertEmailProps) {
  const typeLabel = usageTypeLabels[usageType] || usageTypeLabels.links;
  const isAtLimit = usagePercentage >= 100;
  const isUrgent = usagePercentage >= 90;

  const getSubject = () => {
    if (isAtLimit) return `You've reached your ${typeLabel.name} limit`;
    if (isUrgent) return `${usagePercentage}% of ${typeLabel.name} used - Approaching limit`;
    return `${usagePercentage}% of ${typeLabel.name} used`;
  };

  return (
    <EmailLayout preview={getSubject()}>
      <Heading style={isAtLimit ? headingAtLimit : isUrgent ? headingUrgent : heading}>
        {isAtLimit
          ? `${typeLabel.name.charAt(0).toUpperCase() + typeLabel.name.slice(1)} Limit Reached`
          : `${usagePercentage}% of ${typeLabel.name} used`}
      </Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      {isAtLimit ? (
        <>
          <div style={alertBox}>
            <Text style={alertText}>
              You've used <strong>{currentUsage}</strong> of <strong>{limit}</strong>{" "}
              {typeLabel.name} on your {planName} plan.
            </Text>
          </div>

          <Text style={paragraph}>
            You won't be able to create new {typeLabel.name} until you upgrade your plan or remove
            existing ones.
          </Text>
        </>
      ) : isUrgent ? (
        <>
          <div style={warningBox}>
            <Text style={warningText}>
              You've used <strong>{currentUsage}</strong> of <strong>{limit}</strong>{" "}
              {typeLabel.name} ({usagePercentage}%).
            </Text>
          </div>

          <Text style={paragraph}>
            You're approaching your {typeLabel.name} limit. Consider upgrading your plan to avoid
            any interruption to your service.
          </Text>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            You've used <strong>{currentUsage}</strong> of <strong>{limit}</strong> {typeLabel.name}{" "}
            ({usagePercentage}%) on your {planName} plan.
          </Text>

          <Text style={paragraph}>
            This is a friendly reminder to help you plan ahead. If you're expecting to need more
            {typeLabel.name}, consider upgrading your plan.
          </Text>
        </>
      )}

      {/* Usage Bar */}
      <div style={progressContainer}>
        <div style={progressBar}>
          <div
            style={{
              ...progressFill,
              width: `${Math.min(usagePercentage, 100)}%`,
              backgroundColor: isAtLimit ? "#dc2626" : isUrgent ? "#ea580c" : "#3b82f6",
            }}
          />
        </div>
        <Text style={progressText}>
          {currentUsage} / {limit} {typeLabel.name}
        </Text>
      </div>

      <Button style={isAtLimit ? buttonAtLimit : button} href={upgradeUrl}>
        {isAtLimit ? "Upgrade Now" : "View Plans"}
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        <strong>Your {planName} plan includes:</strong>
      </Text>
      <ul style={list}>
        <li style={listItem}>
          {limit} {typeLabel.name}
        </li>
        <li style={listItem}>All current features</li>
        <li style={listItem}>Email support</li>
      </ul>

      <Text style={smallText}>
        Need more? Upgrade to unlock higher limits and additional features.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#3b82f6",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const headingUrgent: React.CSSProperties = {
  ...heading,
  color: "#ea580c",
};

const headingAtLimit: React.CSSProperties = {
  ...heading,
  color: "#dc2626",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const warningBox: React.CSSProperties = {
  backgroundColor: "#fff7ed",
  borderLeft: "4px solid #ea580c",
  padding: "12px 16px",
  margin: "16px 0",
};

const warningText: React.CSSProperties = {
  color: "#9a3412",
  fontSize: "14px",
  margin: "0",
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

const progressContainer: React.CSSProperties = {
  margin: "24px 0",
};

const progressBar: React.CSSProperties = {
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  height: "8px",
  overflow: "hidden",
  width: "100%",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const progressText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "8px 0 0",
  textAlign: "center" as const,
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

const buttonAtLimit: React.CSSProperties = {
  ...button,
  backgroundColor: "#dc2626",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
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

export default UsageAlertEmail;

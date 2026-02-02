import { Button, Heading, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripUpgradeEmailProps {
  name: string;
  billingUrl: string;
  currentPlan: string;
  linksCreated: number;
  linksLimit: number;
  usagePercent: number;
  recommendedPlan?: string;
}

export function DripUpgradeEmail({
  name = "there",
  billingUrl = "/dashboard/billing",
  currentPlan = "Free",
  linksCreated = 40,
  linksLimit = 50,
  usagePercent = 80,
  recommendedPlan = "Pro",
}: DripUpgradeEmailProps) {
  const isNearLimit = usagePercent >= 90;
  const isAtLimit = usagePercent >= 100;

  return (
    <EmailLayout
      preview={
        isAtLimit
          ? "You've hit your limit - unlock more links"
          : `You're ${usagePercent}% to your limit - time to upgrade?`
      }
    >
      <Heading style={isAtLimit ? headingUrgent : heading}>
        {isAtLimit
          ? "You've reached your link limit 🚫"
          : `You're using ${usagePercent}% of your links`}
      </Heading>

      <Text style={paragraph}>Hey {name},</Text>

      {isAtLimit ? (
        <Text style={paragraph}>
          You've created <strong>{linksCreated}</strong> links on the{" "}
          {currentPlan} plan, which is the maximum allowed. To create more
          links, you'll need to upgrade.
        </Text>
      ) : (
        <Text style={paragraph}>
          Just a heads up - you've created <strong>{linksCreated}</strong> of
          your <strong>{linksLimit}</strong> links on the {currentPlan} plan.{" "}
          {isNearLimit
            ? "You're almost at your limit!"
            : "You're making great progress!"}
        </Text>
      )}

      {/* Usage bar */}
      <div style={usageContainer}>
        <div style={usageBar}>
          <div
            style={{
              ...usageFill,
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: isAtLimit
                ? "#dc2626"
                : isNearLimit
                  ? "#f59e0b"
                  : "#3b82f6",
            }}
          />
        </div>
        <Text style={usageText}>
          {linksCreated} / {linksLimit} links used
        </Text>
      </div>

      <Text style={paragraph}>
        <strong>Why upgrade to {recommendedPlan}?</strong>
      </Text>

      <div style={benefitBox}>
        <Text style={benefitItem}>
          ✅ <strong>2,000 links/month</strong> instead of 50
        </Text>
        <Text style={benefitItem}>
          ✅ <strong>5 custom domains</strong> for branded links
        </Text>
        <Text style={benefitItem}>
          ✅ <strong>Password protection</strong> for sensitive links
        </Text>
        <Text style={benefitItem}>
          ✅ <strong>Link expiration</strong> & click limits
        </Text>
        <Text style={benefitItem}>
          ✅ <strong>Geo & device targeting</strong>
        </Text>
        <Text style={benefitItem}>
          ✅ <strong>API access</strong> for automation
        </Text>
      </div>

      <Text style={priceHighlight}>
        Just $9/month - less than a coffee a week ☕
      </Text>

      <Button style={button} href={billingUrl}>
        Upgrade to {recommendedPlan} →
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Not ready to upgrade? You can also delete unused links to free up space,
        or just keep using your current links - they'll continue working
        forever.
      </Text>

      <Text style={signature}>Rakesh</Text>
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

const headingUrgent: React.CSSProperties = {
  ...heading,
  color: "#dc2626",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const usageContainer: React.CSSProperties = {
  margin: "24px 0",
};

const usageBar: React.CSSProperties = {
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  height: "12px",
  overflow: "hidden",
  width: "100%",
};

const usageFill: React.CSSProperties = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const usageText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "8px 0 0",
  textAlign: "center" as const,
};

const benefitBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const benefitItem: React.CSSProperties = {
  color: "#166534",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "4px 0",
};

const priceHighlight: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: emailConfig.primaryColor,
  borderRadius: "6px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "16px 0 24px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
};

const signature: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0 0",
};

export default DripUpgradeEmail;

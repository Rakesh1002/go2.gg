import { Button, Heading, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripReengagementEmailProps {
  name: string;
  dashboardUrl: string;
  daysSinceLastActivity: number;
}

export function DripReengagementEmail({
  name = "there",
  dashboardUrl = "/dashboard",
  daysSinceLastActivity = 7,
}: DripReengagementEmailProps) {
  const isVeryInactive = daysSinceLastActivity >= 14;

  return (
    <EmailLayout
      preview={
        isVeryInactive
          ? "We miss you! Your links are waiting"
          : "Quick check-in - everything okay?"
      }
    >
      <Heading style={heading}>
        {isVeryInactive ? "We miss you! 👋" : "Quick check-in..."}
      </Heading>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        {isVeryInactive
          ? `It's been ${daysSinceLastActivity} days since you last visited ${emailConfig.productName}. Your account is still active and waiting for you!`
          : `Just checking in - I noticed you haven't been around in a bit. Is there anything I can help you with?`}
      </Text>

      {isVeryInactive ? (
        <>
          <Text style={paragraph}>
            <strong>While you were away, we've added some cool stuff:</strong>
          </Text>

          <div style={updateBox}>
            <Text style={updateItem}>
              🚀 Faster redirect speeds (now under 50ms!)
            </Text>
            <Text style={updateItem}>📊 Improved analytics dashboard</Text>
            <Text style={updateItem}>🔗 Bulk link import from CSV</Text>
            <Text style={updateItem}>🎨 New QR code styles</Text>
          </div>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            <strong>Here are a few quick things you can do right now:</strong>
          </Text>

          <div style={actionBox}>
            <Text style={actionItem}>
              📝 Create a new short link (takes 10 seconds)
            </Text>
            <Text style={actionItem}>📊 Check your link analytics</Text>
            <Text style={actionItem}>🌐 Set up a custom domain</Text>
          </div>
        </>
      )}

      <Button style={button} href={dashboardUrl}>
        Jump Back In →
      </Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        <strong>Running into issues?</strong> Just hit reply and let me know - I
        personally respond to every email and would love to help.
      </Text>

      <Text style={paragraph}>
        If you're no longer interested, no hard feelings! You can{" "}
        <span style={unsubLink}>unsubscribe</span> at any time.
      </Text>

      <Text style={signature}>
        Hope to see you soon,
        <br />
        Rakesh
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
  lineHeight: "26px",
  margin: "16px 0",
};

const updateBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const updateItem: React.CSSProperties = {
  color: "#166534",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "4px 0",
};

const actionBox: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const actionItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "4px 0",
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
  margin: "24px 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const unsubLink: React.CSSProperties = {
  color: "#6b7280",
  textDecoration: "underline",
};

const signature: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0 0",
};

export default DripReengagementEmail;

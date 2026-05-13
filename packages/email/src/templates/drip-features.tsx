import { Button, Heading, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripFeaturesEmailProps {
  name: string;
  dashboardUrl: string;
  linksCreated?: number;
}

export function DripFeaturesEmail({
  name = "there",
  dashboardUrl = "/dashboard",
  linksCreated = 0,
}: DripFeaturesEmailProps) {
  return (
    <EmailLayout preview="3 features that'll make your links work harder">
      <Heading style={heading}>3 features you might not know about 💡</Heading>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        {linksCreated > 0
          ? `You've created ${linksCreated} link${linksCreated > 1 ? "s" : ""} so far - nice! But there's so much more you can do.`
          : "Now that you're set up, let me show you some power features that most users miss."}
      </Text>

      <Text style={paragraph}>
        Here are 3 features that'll make your links work harder for you:
      </Text>

      <Hr style={divider} />

      <div style={featureBlock}>
        <Text style={featureTitle}>🎯 1. Geo Targeting</Text>
        <Text style={featureDesc}>
          Send visitors to different URLs based on their location. Perfect for promoting
          region-specific offers or redirecting to localized landing pages.
        </Text>
      </div>

      <div style={featureBlock}>
        <Text style={featureTitle}>📱 2. Device Detection</Text>
        <Text style={featureDesc}>
          Route mobile users to your app store listing while desktop users go to your website.
          One link, multiple destinations.
        </Text>
      </div>

      <div style={featureBlock}>
        <Text style={featureTitle}>⏰ 3. Link Expiration</Text>
        <Text style={featureDesc}>
          Set links to automatically expire after a certain date or number of clicks. Great for
          time-limited promotions or exclusive content.
        </Text>
      </div>

      <Hr style={divider} />

      <Text style={paragraph}>
        All of these are available right in your dashboard. Just create a link and click
        "Advanced Options" to unlock these features.
      </Text>

      <Button style={button} href={dashboardUrl}>
        Try Advanced Features →
      </Button>

      <Text style={paragraph}>
        <strong>Coming up:</strong> Tomorrow I'll show you how custom domains can boost your
        click-through rates by up to 34%.
      </Text>

      <Text style={signature}>
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

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const featureBlock: React.CSSProperties = {
  margin: "20px 0",
};

const featureTitle: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "17px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const featureDesc: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
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

const signature: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0 0",
};

export default DripFeaturesEmail;

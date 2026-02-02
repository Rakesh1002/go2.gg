import { Button, Heading, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripFirstLinkEmailProps {
  name: string;
  dashboardUrl: string;
  hasCreatedLink?: boolean;
}

export function DripFirstLinkEmail({
  name = "there",
  dashboardUrl = "/dashboard",
  hasCreatedLink = false,
}: DripFirstLinkEmailProps) {
  if (hasCreatedLink) {
    // Congratulations version
    return (
      <EmailLayout preview="Nice work on your first link! Here's what's next...">
        <Heading style={heading}>You're off to a great start! 🚀</Heading>

        <Text style={paragraph}>Hey {name},</Text>

        <Text style={paragraph}>
          I noticed you created your first short link - awesome! You're already ahead of most
          users who sign up but never get started.
        </Text>

        <Text style={paragraph}>
          <strong>Pro tip:</strong> Did you know you can see exactly where your clicks come from?
          Just click on any link to see real-time analytics including:
        </Text>

        <div style={tipBox}>
          <Text style={tipItem}>📍 Geographic location of clickers</Text>
          <Text style={tipItem}>📱 Device and browser breakdown</Text>
          <Text style={tipItem}>🔗 Referrer sources</Text>
          <Text style={tipItem}>⏰ Click timing patterns</Text>
        </div>

        <Button style={button} href={dashboardUrl}>
          View Your Link Analytics →
        </Button>

        <Text style={paragraph}>
          Tomorrow, I'll share how to level up with custom domains and QR codes!
        </Text>

        <Text style={signature}>
          Cheers,
          <br />
          Rakesh
        </Text>
      </EmailLayout>
    );
  }

  // Nudge version
  return (
    <EmailLayout preview="Quick tip: Create your first link in 30 seconds">
      <Heading style={heading}>Ready to create your first link? ✨</Heading>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        I noticed you haven't created your first link yet. No worries - it only takes about 30
        seconds!
      </Text>

      <Text style={paragraph}>
        <strong>Here's how easy it is:</strong>
      </Text>

      <div style={stepBox}>
        <Text style={stepItem}><strong>1.</strong> Paste any long URL</Text>
        <Text style={stepItem}><strong>2.</strong> Click "Shorten"</Text>
        <Text style={stepItem}><strong>3.</strong> That's it! Your link is ready to share</Text>
      </div>

      <Button style={button} href={dashboardUrl}>
        Create Your First Link →
      </Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        <strong>Why shorten links?</strong>
      </Text>

      <Text style={paragraph}>
        Short links aren't just prettier - they're trackable. See exactly who clicks, when they
        click, and where they're clicking from. Perfect for marketing campaigns, social media,
        or just sharing links with friends.
      </Text>

      <Text style={signature}>
        Hit me up if you need any help!
        <br />
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

const tipBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const tipItem: React.CSSProperties = {
  color: "#166534",
  fontSize: "15px",
  lineHeight: "26px",
  margin: "4px 0",
};

const stepBox: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const stepItem: React.CSSProperties = {
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

const signature: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0 0",
};

export default DripFirstLinkEmail;

import { Button, Heading, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DripCustomDomainEmailProps {
  name: string;
  domainsUrl: string;
  hasCustomDomain?: boolean;
}

export function DripCustomDomainEmail({
  name = "there",
  domainsUrl = "/dashboard/domains",
  hasCustomDomain = false,
}: DripCustomDomainEmailProps) {
  if (hasCustomDomain) {
    // Already has domain - send advanced tips
    return (
      <EmailLayout preview="Pro tips for your custom domain">
        <Heading style={heading}>
          Making the most of your custom domain 🌐
        </Heading>

        <Text style={paragraph}>Hey {name},</Text>

        <Text style={paragraph}>
          I see you've already set up a custom domain - great move! Here are a
          few pro tips to maximize its value:
        </Text>

        <div style={tipBox}>
          <Text style={tipItem}>
            <strong>Use consistent slugs:</strong> Create memorable, branded
            slugs like yoursite.com/promo or yoursite.com/demo
          </Text>
          <Text style={tipItem}>
            <strong>Add UTM parameters:</strong> Track which channels drive the
            most clicks with automatic UTM tagging
          </Text>
          <Text style={tipItem}>
            <strong>Create QR codes:</strong> Every link gets a free QR code -
            perfect for print materials
          </Text>
        </div>

        <Button style={button} href={domainsUrl}>
          Manage Your Domains →
        </Button>

        <Text style={paragraph}>
          Need help with DNS setup? Just reply to this email and I'll personally
          help you out.
        </Text>

        <Text style={signature}>Rakesh</Text>
      </EmailLayout>
    );
  }

  // No custom domain - encourage setup
  return (
    <EmailLayout preview="Why branded links get 34% more clicks">
      <Heading style={heading}>
        Why branded links get 34% more clicks 🔗
      </Heading>

      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        Quick fact: Studies show that branded short links get{" "}
        <strong>34% more clicks</strong> than generic ones.
      </Text>

      <Text style={paragraph}>Think about it - which would you click?</Text>

      <div style={comparisonBox}>
        <Text style={badLink}>❌ go2.gg/x7k2mq</Text>
        <Text style={goodLink}>✅ yoursite.com/promo</Text>
      </div>

      <Text style={paragraph}>
        The branded link builds trust and tells people exactly where they're
        going.
      </Text>

      <Text style={paragraph}>
        <strong>Setting up your custom domain takes just 5 minutes:</strong>
      </Text>

      <div style={stepBox}>
        <Text style={stepItem}>
          1. Add your domain in {emailConfig.productName}
        </Text>
        <Text style={stepItem}>
          2. Add one DNS record (we provide the exact value)
        </Text>
        <Text style={stepItem}>3. Wait a few minutes for verification</Text>
        <Text style={stepItem}>4. Start creating branded links!</Text>
      </div>

      <Button style={button} href={domainsUrl}>
        Add Your Custom Domain →
      </Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        <strong>Don't have a domain?</strong> No problem! You can buy one from
        providers like Namecheap, GoDaddy, or Cloudflare for as little as
        $10/year.
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

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const tipBox: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const tipItem: React.CSSProperties = {
  color: "#1e40af",
  fontSize: "15px",
  lineHeight: "26px",
  margin: "8px 0",
};

const comparisonBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const badLink: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "16px",
  fontFamily: "monospace",
  margin: "8px 0",
};

const goodLink: React.CSSProperties = {
  color: "#059669",
  fontSize: "16px",
  fontFamily: "monospace",
  fontWeight: "600",
  margin: "8px 0",
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

export default DripCustomDomainEmail;

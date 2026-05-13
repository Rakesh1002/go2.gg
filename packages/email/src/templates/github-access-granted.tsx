import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface GithubAccessGrantedEmailProps {
  customerName: string;
  githubUsername: string;
  licenseName: string;
  repoUrl: string;
  docsUrl: string;
  discordUrl?: string;
}

export function GithubAccessGrantedEmail({
  customerName = "Customer",
  githubUsername = "username",
  licenseName = "Starter License",
  repoUrl = "https://github.com/org/repo",
  docsUrl = "/docs",
  discordUrl,
}: GithubAccessGrantedEmailProps) {
  return (
    <EmailLayout preview={`GitHub access granted - Welcome to ${emailConfig.productName}!`}>
      <Heading style={heading}>🎉 GitHub Access Granted!</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        Great news! We've added <strong>@{githubUsername}</strong> to our private repository. You
        now have full access to the <strong>{licenseName}</strong> codebase.
      </Text>

      <Button style={button} href={repoUrl}>
        Access Repository
      </Button>

      <Hr style={hr} />

      <Text style={subheading}>Getting Started</Text>

      <Text style={paragraph}>Clone the repository:</Text>

      <div style={codeBox}>
        <Text style={codeText}>git clone {repoUrl}.git</Text>
      </div>

      <Text style={paragraph}>Install dependencies and start developing:</Text>

      <div style={codeBox}>
        <Text style={codeText}>cd your-project</Text>
        <Text style={codeText}>pnpm install</Text>
        <Text style={codeText}>cp env.example .env.local</Text>
        <Text style={codeText}>pnpm dev</Text>
      </div>

      <Hr style={hr} />

      <Text style={subheading}>Helpful Resources</Text>

      <ul style={list}>
        <li style={listItem}>
          📖{" "}
          <a href={docsUrl} style={link}>
            Documentation
          </a>{" "}
          - Setup guides and API reference
        </li>
        <li style={listItem}>🎥 Video tutorials available in the repo's /docs folder</li>
        {discordUrl && (
          <li style={listItem}>
            💬{" "}
            <a href={discordUrl} style={link}>
              Discord community
            </a>{" "}
            - Get help and share your builds
          </li>
        )}
      </ul>

      <Text style={paragraph}>If you have any questions or run into issues, feel free to:</Text>
      <ul style={list}>
        <li style={listItem}>Open an issue on GitHub</li>
        <li style={listItem}>Reply to this email</li>
        {discordUrl && <li style={listItem}>Ask in our Discord server</li>}
      </ul>

      <Text style={paragraph}>Happy building! 🚀</Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#059669",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const subheading: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "24px 0 12px",
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

const button: React.CSSProperties = {
  backgroundColor: "#059669",
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

const codeBox: React.CSSProperties = {
  backgroundColor: "#1f2937",
  borderRadius: "6px",
  padding: "16px",
  margin: "12px 0",
};

const codeText: React.CSSProperties = {
  color: "#e5e7eb",
  fontSize: "13px",
  fontFamily: "'Fira Code', 'Monaco', 'Menlo', monospace",
  lineHeight: "20px",
  margin: "2px 0",
};

const list: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
  paddingLeft: "24px",
};

const listItem: React.CSSProperties = {
  margin: "8px 0",
};

const link: React.CSSProperties = {
  color: emailConfig.primaryColor,
  textDecoration: "underline",
};

export default GithubAccessGrantedEmail;

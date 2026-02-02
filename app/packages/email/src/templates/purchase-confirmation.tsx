import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "../components/layout";

interface PurchaseConfirmationEmailProps {
  customerName?: string;
  licenseName: string;
  licenseId: string;
  amount: string;
  githubUsername?: string;
  discordInvite?: string;
  docsUrl?: string;
  supportEmail?: string;
  productName?: string;
}

export function PurchaseConfirmationEmail({
  customerName = "there",
  licenseName = "Starter",
  licenseId = "personal",
  amount = "$99",
  githubUsername,
  discordInvite = "https://discord.gg/shipquest",
  docsUrl = "https://shipquest.dev/docs",
  supportEmail = "support@shipquest.dev",
  productName = "ShipQuest",
}: PurchaseConfirmationEmailProps) {
  const previewText = `Welcome to ${productName}! Your ${licenseName} license is ready.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>{productName}</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>🎉 Welcome to {productName}!</Heading>

            <Text style={paragraph}>Hey {customerName},</Text>

            <Text style={paragraph}>
              Thank you for purchasing the <strong>{licenseName} License</strong>! You now have
              access to the complete {productName} codebase with all features included.
            </Text>

            {/* Order Summary */}
            <Section style={orderBox}>
              <Text style={orderTitle}>Order Summary</Text>
              <Hr style={divider} />
              <table style={orderTable}>
                <tr>
                  <td style={orderLabel}>License</td>
                  <td style={orderValue}>{licenseName}</td>
                </tr>
                <tr>
                  <td style={orderLabel}>Amount</td>
                  <td style={orderValue}>{amount}</td>
                </tr>
                {githubUsername && (
                  <tr>
                    <td style={orderLabel}>GitHub</td>
                    <td style={orderValue}>@{githubUsername}</td>
                  </tr>
                )}
              </table>
            </Section>

            {/* GitHub Access */}
            <Section style={stepSection}>
              <Text style={stepTitle}>📦 Step 1: Access the Repository</Text>
              <Text style={stepText}>
                {githubUsername ? (
                  <>
                    We've sent a GitHub invitation to <strong>@{githubUsername}</strong>. Check your
                    email and accept the invitation to get access to the private repository.
                  </>
                ) : (
                  <>
                    Visit the link below to submit your GitHub username and get repository access.
                  </>
                )}
              </Text>
              {!githubUsername && (
                <Button style={button} href="https://shipquest.dev/purchase/access">
                  Get Repository Access
                </Button>
              )}
            </Section>

            {/* Discord */}
            <Section style={stepSection}>
              <Text style={stepTitle}>💬 Step 2: Join the Community</Text>
              <Text style={stepText}>
                Connect with other developers, get help, and share what you're building in our
                Discord community.
              </Text>
              <Button style={buttonSecondary} href={discordInvite}>
                Join Discord
              </Button>
            </Section>

            {/* Documentation */}
            <Section style={stepSection}>
              <Text style={stepTitle}>📚 Step 3: Start Building</Text>
              <Text style={stepText}>
                Check out the documentation to get up and running quickly. Most developers have
                their first app running in under 10 minutes!
              </Text>
              <Button style={buttonSecondary} href={docsUrl}>
                View Documentation
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Support */}
            <Text style={paragraph}>
              <strong>Need help?</strong> Reply to this email or reach out at{" "}
              <Link href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </Link>
              . We're here to help you succeed!
            </Text>

            <Text style={paragraph}>
              Happy building! 🚀
              <br />
              <br />— The {productName} Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you purchased {productName}.
              <br />
              <Link href="https://shipquest.dev" style={footerLink}>
                shipquest.dev
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PurchaseConfirmationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#6366f1",
  padding: "24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "32px 24px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 24px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: "0 0 16px 0",
};

const orderBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const orderTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px 0",
};

const orderTable = {
  width: "100%",
};

const orderLabel = {
  fontSize: "14px",
  color: "#6b7280",
  padding: "4px 0",
};

const orderValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1f2937",
  textAlign: "right" as const,
  padding: "4px 0",
};

const stepSection = {
  margin: "24px 0",
};

const stepTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 8px 0",
};

const stepText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 12px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const buttonSecondary = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  color: "#374151",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "20px",
};

const footerLink = {
  color: "#6366f1",
  textDecoration: "none",
};

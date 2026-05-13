import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { emailConfig } from "../config.js";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={emailConfig.logoUrl}
              width="40"
              height="40"
              alt={emailConfig.productName}
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>This email was sent by {emailConfig.companyName}</Text>
            <Text style={footerText}>
              <Link href={emailConfig.siteUrl} style={footerLink}>
                {emailConfig.siteUrl.replace("https://", "")}
              </Link>
              {" | "}
              <Link href={`mailto:${emailConfig.supportEmail}`} style={footerLink}>
                Contact Support
              </Link>
            </Text>
            {emailConfig.social.twitter && (
              <Text style={footerText}>
                <Link href={emailConfig.social.twitter} style={footerLink}>
                  Twitter
                </Link>
                {emailConfig.social.github && (
                  <>
                    {" | "}
                    <Link href={emailConfig.social.github} style={footerLink}>
                      GitHub
                    </Link>
                  </>
                )}
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header: React.CSSProperties = {
  padding: "24px",
  borderBottom: "1px solid #e6ebf1",
};

const logo: React.CSSProperties = {
  margin: "0 auto",
};

const content: React.CSSProperties = {
  padding: "24px",
};

const footer: React.CSSProperties = {
  padding: "24px",
  borderTop: "1px solid #e6ebf1",
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
};

const footerLink: React.CSSProperties = {
  color: "#8898aa",
  textDecoration: "underline",
};

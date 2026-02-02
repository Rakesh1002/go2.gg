import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Shield, Lock, Key, Eye, FileCheck, Server } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Security - Enterprise-Grade Protection",
  description:
    "SOC2 compliant, GDPR ready. Password protection, SSO, encryption, and abuse prevention for your links.",
});

const features = [
  {
    icon: Shield,
    title: "SOC2 Compliant",
    description:
      "Our infrastructure and processes meet SOC2 Type II requirements. Audited annually by independent third parties.",
  },
  {
    icon: Lock,
    title: "Password Protection",
    description:
      "Add passwords to sensitive links. Control who can access your content with secure authentication.",
  },
  {
    icon: Key,
    title: "Single Sign-On (SSO)",
    description:
      "SAML and OIDC support for enterprise identity providers. Google, Okta, Azure AD, and more.",
  },
  {
    icon: Eye,
    title: "Privacy First",
    description:
      "GDPR and CCPA compliant. We don't sell data, and we give you tools to respect visitor privacy.",
  },
  {
    icon: FileCheck,
    title: "Audit Logging",
    description:
      "Complete audit trail of all actions. Know who did what and when for compliance requirements.",
  },
  {
    icon: Server,
    title: "Abuse Prevention",
    description:
      "Automated scanning detects malicious links. We protect your brand and your visitors.",
  },
];

const benefits = [
  "Enterprise security standards",
  "Protect sensitive content",
  "Meet compliance requirements",
  "Prevent link abuse and spam",
  "Full visibility with audit logs",
  "Trust badges for your organization",
];

const faqs = [
  {
    question: "Is Go2 SOC2 certified?",
    answer:
      "Yes, we are SOC2 Type II certified. We can provide our audit report to enterprise customers under NDA.",
  },
  {
    question: "How do you protect against malicious links?",
    answer:
      "We scan all links against malware databases and phishing registries. Suspicious links are automatically blocked.",
  },
  {
    question: "Do you support SSO?",
    answer:
      "Yes, we support SAML 2.0 and OIDC for enterprise SSO. We integrate with Okta, Azure AD, Google Workspace, and more.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Data is stored on Cloudflare's global network with encryption at rest and in transit. We can provide data residency options for enterprise customers.",
  },
];

// Security Demo
function SecurityDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">
          Security Overview
        </h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">Enterprise-grade protection</p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Compliance Badges */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Compliance & Certifications
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <Shield className="h-8 w-8 text-[var(--marketing-accent)] mb-2" />
              <span className="text-sm font-semibold text-[var(--marketing-text)]">SOC2</span>
              <span className="text-xs text-[var(--marketing-text-muted)]">Type II</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <Lock className="h-8 w-8 text-[var(--marketing-accent)] mb-2" />
              <span className="text-sm font-semibold text-[var(--marketing-text)]">GDPR</span>
              <span className="text-xs text-[var(--marketing-text-muted)]">Compliant</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <FileCheck className="h-8 w-8 text-[var(--marketing-accent)] mb-2" />
              <span className="text-sm font-semibold text-[var(--marketing-text)]">CCPA</span>
              <span className="text-xs text-[var(--marketing-text-muted)]">Compliant</span>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Security Features
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">Encryption</div>
                <div className="text-xs text-[var(--marketing-text-muted)]">
                  TLS 1.3 in transit, AES-256 at rest
                </div>
              </div>
              <div className="text-xs text-green-500 font-medium">Active</div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Two-Factor Auth
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)]">
                  TOTP and WebAuthn supported
                </div>
              </div>
              <div className="text-xs text-green-500 font-medium">Active</div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Malware Scanning
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)]">
                  All links scanned automatically
                </div>
              </div>
              <div className="text-xs text-green-500 font-medium">Active</div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Audit Logging
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)]">90-day retention</div>
              </div>
              <div className="text-xs text-green-500 font-medium">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <FeaturePageTemplate
      badge="Enterprise Security"
      title="Serious About Security"
      subtitle="SOC2 certified, GDPR compliant, and built with security from the ground up. Your links and data are always protected."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<SecurityDemo />}
      ctaTitle="Security without compromise"
      ctaDescription="Enterprise-grade security on every plan."
    />
  );
}

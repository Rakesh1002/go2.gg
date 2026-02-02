import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Shield, Headphones, Zap, Server, Lock, Users } from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { IntegrationLogos } from "@/components/marketing/sections/integration-logos";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Enterprise - Self-Serve Enterprise, No Sales Calls",
  description:
    "Enterprise-grade link management with SSO, audit logs, 99.99% SLA, and dedicated support. Try before you buy — no sales process required.",
});

const useCases = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SSO/SAML integration, audit logs, IP allowlisting, and SOC 2 Type II compliance. Your security team will approve this.",
  },
  {
    icon: Lock,
    title: "Data Sovereignty",
    description:
      "Choose data residency. Self-host option available. Your data never leaves your approved regions.",
  },
  {
    icon: Zap,
    title: "99.99% SLA Guaranteed",
    description:
      "Financially-backed uptime guarantee. Real-time status page. If we're down, you get credits.",
  },
  {
    icon: Headphones,
    title: "Dedicated Success Team",
    description:
      "Named account manager, priority support queue, custom onboarding, and quarterly business reviews.",
  },
  {
    icon: Users,
    title: "Unlimited Scale",
    description:
      "Unlimited links, clicks, domains, and team members. No usage caps, no surprise bills.",
  },
  {
    icon: Server,
    title: "Self-Host Option",
    description:
      "MIT licensed. Deploy on your own infrastructure. Full source code access. No vendor lock-in.",
  },
];

const benefits = [
  "Self-serve trial — no mandatory sales calls",
  "SSO/SAML with major identity providers",
  "Audit logs for compliance reporting",
  "99.99% uptime SLA with financial backing",
  "Unlimited everything — no usage caps",
  "Dedicated account manager",
  "Custom contract and invoicing available",
  "Self-hosting option (MIT licensed)",
  "SOC 2 Type II compliant",
  "Priority feature requests and roadmap input",
];

const enterpriseStats = [
  { value: "99.99%", label: "Uptime SLA", description: "Financially backed" },
  { value: "SOC 2", label: "Type II", description: "Compliant" },
  { value: "∞", label: "Everything", description: "No usage caps" },
  { value: "<24h", label: "Response", description: "Priority support" },
];

const ssoIntegrations = [
  { name: "Okta" },
  { name: "Azure AD" },
  { name: "OneLogin" },
  { name: "Google" },
  { name: "Auth0" },
  { name: "Ping" },
];

const enterpriseSteps = [
  {
    step: 1,
    title: "Start a trial",
    description:
      "No sales calls required. Get full access to enterprise features for 14 days. Self-serve.",
  },
  {
    step: 2,
    title: "Configure SSO & security",
    description:
      "Connect your identity provider. Set up audit logs, IP allowlisting, and compliance features.",
  },
  {
    step: 3,
    title: "Talk to sales (optional)",
    description: "Need custom contracts, SLAs, or invoicing? Our team is here when you're ready.",
  },
];

const enterpriseFaqs = [
  {
    question: "Do I need to talk to sales?",
    answer:
      "No. Start a 14-day trial with full enterprise features immediately. Talk to sales when (and if) you're ready.",
  },
  {
    question: "What SSO providers do you support?",
    answer:
      "We support SAML 2.0, which works with Okta, Azure AD, OneLogin, Google Workspace, Auth0, Ping, and most enterprise identity providers.",
  },
  {
    question: "Is there an SLA?",
    answer:
      "Yes. 99.99% uptime SLA with financial backing. If we're down, you get service credits.",
  },
  {
    question: "Can I self-host Go2?",
    answer:
      "Yes. Go2 is MIT licensed. Deploy on your own infrastructure for complete data control. We provide support for self-hosted deployments.",
  },
];

export default function EnterprisePage() {
  return (
    <SolutionsPageTemplate
      badge="Enterprise Ready"
      title="Enterprise Features. Self-Serve Simplicity."
      subtitle="Get the security, compliance, and scale your organization needs — without sitting through sales calls. Start a trial today, talk to sales when you're ready."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Start enterprise trial"
      ctaDescription="14-day trial with all enterprise features. Talk to sales when you're ready."
      stats={
        <MetricsHighlight headline="Enterprise-grade, startup simple" stats={enterpriseStats} />
      }
      integrations={
        <IntegrationLogos
          headline="SSO with your identity provider"
          subheadline="SAML 2.0 compatible with all major providers"
          integrations={ssoIntegrations}
        />
      }
      howItWorks={
        <HowItWorks
          headline="Enterprise onboarding"
          subheadline="From trial to production in your timeline"
          steps={enterpriseSteps}
        />
      }
      faqs={enterpriseFaqs}
    />
  );
}

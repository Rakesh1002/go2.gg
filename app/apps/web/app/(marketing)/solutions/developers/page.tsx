import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Code2, Zap, Book, Github, Terminal, Webhook } from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { CodePreview } from "@/components/marketing/sections/code-preview";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { IntegrationLogos } from "@/components/marketing/sections/integration-logos";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Developers - API-First URL Shortening",
  description:
    "API-first URL shortening with TypeScript SDK, webhooks, and MCP server for AI assistants.",
});

const useCases = [
  {
    icon: Code2,
    title: "REST API That Just Works",
    description:
      "Full API access on all plans — even free. OpenAPI spec included. No rate limit surprises.",
  },
  {
    icon: Terminal,
    title: "TypeScript SDK",
    description:
      "First-class TypeScript support with full type inference. Install, import, ship. Under 5 minutes to integrate.",
  },
  {
    icon: Webhook,
    title: "Real-Time Webhooks",
    description:
      "Get notified instantly on clicks, link creation, and threshold events. Build reactive integrations.",
  },
  {
    icon: Github,
    title: "Fully Open Source",
    description: "MIT licensed. Read the code, open PRs, or self-host. No vendor lock-in. Ever.",
  },
  {
    icon: Zap,
    title: "Edge-Native Architecture",
    description:
      "Cloudflare Workers at the core. Sub-10ms redirects from 310+ locations. P99 under 15ms.",
  },
  {
    icon: Book,
    title: "Docs You'll Actually Read",
    description:
      "Interactive API explorer. Copy-paste examples. No 40-page PDFs. Get started in 60 seconds.",
  },
];

const benefits = [
  "Full API access on free tier (Bitly charges $29/mo)",
  "Sub-10ms redirects — 5x faster than Bitly",
  "TypeScript SDK with full IntelliSense",
  "Real-time webhooks, not batched callbacks",
  "OpenAPI spec for code generation",
  "MIT licensed — view and contribute on GitHub",
  "MCP server for AI agent integration",
  "No rate limits on reasonable usage",
];

const devStats = [
  { value: "<10ms", label: "API Response", description: "P99 globally" },
  { value: "MIT", label: "License", description: "Fully open source" },
  { value: "Free", label: "API Access", description: "All plans" },
  { value: "100%", label: "TypeScript", description: "Full type safety" },
];

const devIntegrations = [
  { name: "Node.js" },
  { name: "Python" },
  { name: "Go" },
  { name: "Vercel" },
  { name: "Cloudflare" },
  { name: "AWS Lambda" },
  { name: "Supabase" },
  { name: "Prisma" },
];

const devSteps = [
  {
    step: 1,
    title: "npm install @go2/sdk",
    description:
      "Install our TypeScript SDK. Full type inference and IntelliSense support out of the box.",
  },
  {
    step: 2,
    title: "Get your API key",
    description: "Generate a key from the dashboard. Scoped permissions available for security.",
  },
  {
    step: 3,
    title: "Create links",
    description:
      "One line: client.links.create({ url }). Full API docs and interactive explorer available.",
  },
];

const devFaqs = [
  {
    question: "Is the API free?",
    answer:
      "Yes. Full API access is included on all plans, including Free. Bitly charges $29/mo for API access.",
  },
  {
    question: "Is Go2 open source?",
    answer:
      "Yes. Go2 is MIT licensed. View the source, contribute PRs, or self-host on your own infrastructure.",
  },
  {
    question: "What SDKs are available?",
    answer:
      "Official TypeScript/Node.js SDK with full type inference. Community SDKs available for Python and Go.",
  },
  {
    question: "How do webhooks work?",
    answer:
      "Configure webhook endpoints in the dashboard. We send real-time POST requests for clicks, link creation, and more. Retry logic included.",
  },
];

export default function DevelopersPage() {
  return (
    <SolutionsPageTemplate
      badge="For Developers"
      title="API-First URL Shortening"
      subtitle="Built by developers, for developers. Full API, SDKs, webhooks, and open source. Integrate Go2 into your app in minutes."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Start Building"
      ctaDescription="Get your API key and start creating links in seconds."
      heroImage={<CodePreview />}
      stats={
        <MetricsHighlight headline="Developer experience that doesn't suck" stats={devStats} />
      }
      integrations={
        <IntegrationLogos
          headline="Works with your stack"
          subheadline="SDKs and examples for popular frameworks"
          integrations={devIntegrations}
        />
      }
      howItWorks={
        <HowItWorks
          headline="Integrate in 5 minutes"
          subheadline="From npm install to production"
          steps={devSteps}
        />
      }
      faqs={devFaqs}
    />
  );
}

import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Code2, Zap, Shield, Book, Webhook, Terminal, Server, Key } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { IntegrationLogos } from "@/components/marketing/sections/integration-logos";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Developer API - Full Access on Free Tier",
  description:
    "Full REST API on all plans including Free. TypeScript SDK, real-time webhooks, OpenAPI spec. Integrate in under 5 minutes.",
});

const features = [
  {
    icon: Zap,
    title: "Sub-10ms API Responses",
    description:
      "Edge-native API built on Cloudflare Workers. P99 under 15ms globally. Your integrations stay fast.",
  },
  {
    icon: Terminal,
    title: "TypeScript-First SDK",
    description:
      "First-class TypeScript support with full type inference. npm install, import, ship. 5 minutes to integrate.",
  },
  {
    icon: Webhook,
    title: "Real-Time Webhooks",
    description:
      "Instant notifications for clicks, creations, and updates. Not batched callbacks. Retry logic included.",
  },
  {
    icon: Book,
    title: "Docs That Don't Suck",
    description:
      "Interactive API explorer. Copy-paste examples. OpenAPI spec for codegen. No 40-page PDFs.",
  },
  {
    icon: Shield,
    title: "Scoped API Keys",
    description:
      "Granular permissions per key. Read-only keys for analytics. Write keys for link management. Revoke instantly.",
  },
  {
    icon: Key,
    title: "Simple Auth",
    description:
      "Bearer token authentication. No OAuth complexity unless you want it. Generate keys in dashboard.",
  },
];

const benefits = [
  "Full API access on Free tier (Bitly charges $29/mo)",
  "Sub-10ms response times globally",
  "TypeScript SDK with full IntelliSense",
  "Real-time webhooks, not batched",
  "OpenAPI spec for code generation",
  "Scoped API keys for security",
  "Sync click data to your warehouse",
  "Build short links into your product",
];

const faqs = [
  {
    question: "Is the API really free?",
    answer:
      "Yes. Full API access is included on all plans, including Free. Bitly charges $29/mo for API access. We believe developers shouldn't pay extra for programmatic access.",
  },
  {
    question: "What's the rate limit?",
    answer:
      "Free tier: 100 requests/minute. Pro: 1,000/minute. Business: 10,000/minute. Enterprise: custom. We don't throttle reasonable usage.",
  },
  {
    question: "Do webhooks work on the free plan?",
    answer:
      "Webhooks require Pro or higher. Free tier has full API access for creating/reading links and analytics.",
  },
  {
    question: "Is there an OpenAPI spec?",
    answer: "Yes. Full OpenAPI 3.0 specification available for code generation in any language.",
  },
];

// Code Demo Component
function CodeDemo() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-[#0d1117] border border-gray-800 text-left font-mono text-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-gray-800">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
        <span className="ml-2 text-xs text-gray-400">create-link.ts</span>
      </div>
      <div className="p-6 overflow-x-auto text-gray-300">
        <div className="leading-relaxed">
          <span className="text-purple-400">import</span>{" "}
          <span className="text-yellow-100">
            {`{`} Go2 {`}`}
          </span>{" "}
          <span className="text-purple-400">from</span>{" "}
          <span className="text-green-400">'@go2/sdk'</span>;<br />
          <br />
          <span className="text-gray-500">{`// Initialize the client`}</span>
          <br />
          <span className="text-purple-400">const</span>{" "}
          <span className="text-blue-400">client</span> ={" "}
          <span className="text-purple-400">new</span> <span className="text-yellow-100">Go2</span>(
          {`{`}
          <br />
          &nbsp;&nbsp;<span className="text-blue-300">apiKey</span>:{" "}
          <span className="text-green-400">process.env.GO2_API_KEY</span>
          <br />
          {`}`});
          <br />
          <br />
          <span className="text-gray-500">{`// Create a branded short link`}</span>
          <br />
          <span className="text-purple-400">const</span> <span className="text-blue-400">link</span>{" "}
          = <span className="text-purple-400">await</span>{" "}
          <span className="text-blue-400">client</span>.<span className="text-blue-300">links</span>
          .<span className="text-yellow-100">create</span>({`{`}
          <br />
          &nbsp;&nbsp;<span className="text-blue-300">url</span>:{" "}
          <span className="text-green-400">'https://example.com/long-url'</span>
          ,<br />
          &nbsp;&nbsp;<span className="text-blue-300">domain</span>:{" "}
          <span className="text-green-400">'link.brand.co'</span>,<br />
          &nbsp;&nbsp;<span className="text-blue-300">tags</span>: [
          <span className="text-green-400">'marketing'</span>,{" "}
          <span className="text-green-400">'summer-sale'</span>]<br />
          {`}`});
          <br />
          <br />
          <span className="text-yellow-100">console</span>.
          <span className="text-yellow-100">log</span>(<span className="text-blue-400">link</span>.
          <span className="text-blue-300">shortUrl</span>);
          <br />
          <span className="text-gray-500">{`// -> https://link.brand.co/xyz789`}</span>
        </div>
      </div>
    </div>
  );
}

const apiStats = [
  { value: "<10ms", label: "Response Time", description: "P99 globally" },
  { value: "99.99%", label: "Uptime", description: "SLA guaranteed" },
  { value: "100+", label: "Endpoints", description: "Full coverage" },
  { value: "Free", label: "API Access", description: "All plans" },
];

const apiIntegrations = [
  { name: "Zapier" },
  { name: "Make" },
  { name: "n8n" },
  { name: "Slack" },
  { name: "Discord" },
  { name: "HubSpot" },
  { name: "Salesforce" },
  { name: "Segment" },
];

const apiSteps = [
  {
    step: 1,
    title: "Get your API key",
    description: "Generate an API key from your dashboard. Takes 10 seconds.",
  },
  {
    step: 2,
    title: "Install the SDK",
    description: "npm install @go2/sdk — fully typed TypeScript support out of the box.",
  },
  {
    step: 3,
    title: "Create your first link",
    description: "One line of code: client.links.create({ url: 'https://...' })",
  },
];

export default function APIPage() {
  return (
    <FeaturePageTemplate
      badge="Free API Access"
      title="An API That Doesn't Suck"
      subtitle="Full API access on all plans — even Free. TypeScript SDK, real-time webhooks, and sub-10ms responses. Integrate in 5 minutes, not 5 days."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<CodeDemo />}
      ctaTitle="Get your API key"
      ctaDescription="Free tier includes full API access. No credit card required."
      metricsHighlight={
        <MetricsHighlight headline="Built for developers who ship fast" stats={apiStats} />
      }
      integrations={
        <IntegrationLogos
          headline="Works with your stack"
          subheadline="Native integrations and webhooks for all major platforms"
          integrations={apiIntegrations}
        />
      }
      howItWorks={
        <HowItWorks
          headline="Integrate in 5 minutes"
          subheadline="From zero to production in three steps"
          steps={apiSteps}
        />
      }
    />
  );
}

import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import {
  Clock,
  Globe,
  Smartphone,
  Users,
  ArrowUpRight,
  Zap,
  Shield,
} from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { ComparisonWidget } from "@/components/marketing/sections/comparison-widget";

export const metadata: Metadata = getMetadata({
  title: "Real-Time Analytics - Track Clicks in Under 10ms",
  description:
    "Edge-native analytics that don't slow down your links. Geographic data, device insights, and referrer tracking. Privacy-first, GDPR compliant.",
});

const features = [
  {
    icon: Zap,
    title: "Sub-10ms Data Collection",
    description:
      "Our edge-native architecture captures analytics without adding latency. Your links stay fast while you get complete visibility.",
  },
  {
    icon: Clock,
    title: "Truly Real-Time",
    description:
      "Watch clicks stream in live. No batching, no delays. See your campaigns perform the moment someone clicks.",
  },
  {
    icon: Globe,
    title: "City-Level Precision",
    description:
      "Know exactly where your audience is — down to city and region. Powered by our 310+ edge locations worldwide.",
  },
  {
    icon: Smartphone,
    title: "Device Intelligence",
    description:
      "Understand which devices, browsers, and operating systems your audience uses. Optimize content for what matters.",
  },
  {
    icon: Users,
    title: "Source Attribution",
    description:
      "Track exactly where traffic comes from — social platforms, search engines, email campaigns, or specific referrers.",
  },
  {
    icon: Shield,
    title: "Privacy by Design",
    description:
      "IP hashing by default. No tracking cookies. No personal data collection. GDPR & CCPA compliant out of the box.",
  },
];

const benefits = [
  "Analytics that don't slow down your redirects",
  "Real-time data, not next-day reports",
  "Privacy-first: No cookies, no PII collection",
  "Built-in bot filtering for accurate counts",
  "Export to CSV for custom reporting",
  "Free analytics on all plans (competitors charge extra)",
];

const faqs = [
  {
    question: "How is Go2 analytics different from Bitly or Rebrandly?",
    answer:
      "Unlike Bitly which batches data hourly, Go2 provides truly real-time analytics with sub-second updates. Plus, detailed analytics are free on all plans — Bitly charges $29/mo for geographic data.",
  },
  {
    question: "Do analytics slow down my link redirects?",
    answer:
      "No. Our edge-native architecture captures analytics asynchronously. Your redirects complete in under 10ms — analytics collection happens in the background.",
  },
  {
    question: "Is the data GDPR compliant?",
    answer:
      "Yes. We hash IP addresses by default, don't use tracking cookies, and never collect personally identifiable information. Your links are privacy-compliant out of the box.",
  },
  {
    question: "Do you filter out bots?",
    answer:
      "Yes. Our edge network automatically filters known bots and crawlers, so your click counts reflect real human visitors.",
  },
];

// Simulated Dashboard Demo Component
function AnalyticsDemo() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-[var(--marketing-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--marketing-border)] border-b bg-[var(--marketing-bg-elevated)] p-4">
        <div>
          <div className="font-medium text-[var(--marketing-text)] text-sm">
            Campaign Performance
          </div>
          <div className="text-[var(--marketing-text-muted)] text-xs">Last 24 Hours</div>
        </div>
        <div className="flex gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <div className="font-medium text-green-500 text-xs">Live</div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 p-6">
        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
            <div className="mb-1 text-[var(--marketing-text-muted)] text-xs">Total Clicks</div>
            <div className="font-bold text-2xl text-[var(--marketing-text)]">12,453</div>
            <div className="mt-1 flex items-center text-green-500 text-xs">
              <ArrowUpRight className="mr-1 h-3 w-3" /> +15%
            </div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
            <div className="mb-1 text-[var(--marketing-text-muted)] text-xs">Top Country</div>
            <div className="flex items-center gap-2 font-bold text-2xl text-[var(--marketing-text)]">
              <Globe className="h-5 w-5 text-blue-500" /> USA
            </div>
            <div className="mt-1 text-[var(--marketing-text-muted)] text-xs">45% of traffic</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
            <div className="mb-1 text-[var(--marketing-text-muted)] text-xs">Top Referrer</div>
            <div className="font-bold text-2xl text-[var(--marketing-text)]">Twitter</div>
            <div className="mt-1 text-[var(--marketing-text-muted)] text-xs">3.2k clicks</div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative flex h-48 items-end justify-between gap-1 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
          {[
            30, 45, 25, 60, 40, 75, 55, 80, 65, 90, 70, 50, 60, 40, 55, 35, 65, 85, 95, 75, 60, 45,
            30, 20,
          ].map((h, i) => (
            <div
              key={i}
              className="w-full rounded-t bg-[var(--marketing-accent)]/20 transition-colors hover:bg-[var(--marketing-accent)]/40"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const analyticsStats = [
  { value: "<10ms", label: "Data Collection", description: "Zero latency impact" },
  { value: "310+", label: "Edge Locations", description: "Worldwide coverage" },
  { value: "99.9%", label: "Accuracy", description: "Bot filtering included" },
  { value: "Real-time", label: "Updates", description: "No batching delays" },
];

export default function AnalyticsPage() {
  return (
    <FeaturePageTemplate
      badge="Edge-Native Analytics"
      title="Analytics That Don't Slow You Down"
      subtitle="Real-time insights from 310+ edge locations. Track clicks, locations, devices, and referrers — all while keeping redirects under 10ms. Privacy-first by default."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<AnalyticsDemo />}
      ctaTitle="See your data in real-time"
      ctaDescription="Free analytics on all plans. No credit card required."
      agentCallout={{
        title: "Click data carries the agent that created the link.",
        body:
          "Every click on Go2 records the (agent_id, agent_run_id, agent_actor_id, agent_tool_call_id) of the link that produced it. Group analytics by run to see what one Claude session drove. Filter by agent_id to compare agents. Pull /api/v1/agent-attribution into your trace UI and rewind any click back to the prompt that made it.",
        primitive: "clicks.agentId · /api/v1/agent-attribution · /agent-attribution/runs",
      }}
      metricsHighlight={
        <MetricsHighlight headline="Built for speed and accuracy" stats={analyticsStats} />
      }
      comparisonWidget={
        <ComparisonWidget
          feature="Detailed Analytics"
          headline="Analytics pricing comparison"
          go2={{ value: "Free", highlight: true }}
          competitors={[
            { name: "Bitly", value: "$29/mo" },
            { name: "Rebrandly", value: "$25/mo" },
            { name: "Short.io", value: "$19/mo" },
          ]}
        />
      }
    />
  );
}

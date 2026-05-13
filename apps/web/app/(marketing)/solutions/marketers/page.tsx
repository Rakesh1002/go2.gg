import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { BarChart3, Target, Globe, Users, Zap, TrendingUp } from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { ComparisonWidget } from "@/components/marketing/sections/comparison-widget";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Marketers - Track Every Campaign",
  description:
    "URL shortening built for marketing teams. UTM tracking, campaign analytics, and team collaboration.",
});

const useCases = [
  {
    icon: BarChart3,
    title: "Real-Time Campaign Tracking",
    description:
      "See clicks as they happen, not in next-day reports. Know which campaigns are working while you can still adjust.",
  },
  {
    icon: Target,
    title: "Built-in UTM Manager",
    description:
      "Generate and manage UTM parameters without spreadsheets. Auto-append to links. Never lose attribution again.",
  },
  {
    icon: Globe,
    title: "Geo-Targeted Campaigns",
    description:
      "Send US traffic to .com and EU traffic to .eu. Localize landing pages automatically by visitor location.",
  },
  {
    icon: TrendingUp,
    title: "A/B Split Testing",
    description:
      "Test multiple destinations with automatic traffic splitting. See which landing page converts better.",
  },
  {
    icon: Users,
    title: "Marketing Team Workspace",
    description:
      "Shared link libraries, campaign folders, and role-based access. Everyone stays aligned, nothing gets lost.",
  },
  {
    icon: Zap,
    title: "Speed = Conversions",
    description:
      "Sub-10ms redirects. Every 100ms of latency costs 7% conversions. Your links load 5x faster than Bitly.",
  },
];

const benefits = [
  "Prove campaign ROI with click-level attribution",
  "A/B test destinations without dev work",
  "UTM manager with saved templates",
  "30-50% cheaper than Bitly Enterprise",
  "Branded domains on all plans (free)",
  "Real-time data, not next-day reports",
  "Retargeting pixel support (Facebook, Google, TikTok)",
  "Unlimited team members — no per-seat pricing",
];

const marketerStats = [
  { value: "Real-time", label: "Analytics", description: "Not next-day" },
  { value: "50%", label: "Cheaper", description: "vs Bitly Enterprise" },
  { value: "Free", label: "Domains", description: "Unlimited branded" },
  { value: "∞", label: "Team Members", description: "No per-seat fees" },
];

const marketerFaqs = [
  {
    question: "How is Go2 cheaper than Bitly?",
    answer:
      "Bitly Enterprise starts at $199/mo with per-seat fees. Go2 Business is $49/mo with unlimited seats. We don't charge for custom domains either.",
  },
  {
    question: "Does Go2 support retargeting pixels?",
    answer:
      "Yes. Add Facebook, Google, TikTok, and other retargeting pixels to your links. Visitors get pixeled even on short link clicks.",
  },
  {
    question: "Can I A/B test landing pages?",
    answer:
      "Yes. Set up multiple destinations with percentage-based traffic splitting. See which variant converts better in real-time.",
  },
  {
    question: "Is UTM tracking built in?",
    answer:
      "Yes. Create and save UTM templates. Auto-append UTMs to links. Export data with full attribution for your analytics tools.",
  },
];

export default function MarketersPage() {
  return (
    <SolutionsPageTemplate
      badge="Built for Growth"
      title="Know What's Working. In Real-Time."
      subtitle="Stop waiting for next-day reports. Track clicks as they happen, A/B test destinations, and prove campaign ROI — all for 50% less than Bitly."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Start optimizing campaigns"
      ctaDescription="14-day Pro trial with full analytics. No credit card required."
      stats={
        <MetricsHighlight
          headline="Marketing tools that pay for themselves"
          stats={marketerStats}
        />
      }
      socialProof={
        <ComparisonWidget
          feature="Marketing Plan Pricing"
          headline="Compare before you commit"
          go2={{ value: "$49/mo", highlight: true }}
          competitors={[
            { name: "Bitly Enterprise", value: "$199/mo" },
            { name: "Rebrandly", value: "$99/mo" },
            { name: "Short.io", value: "$79/mo" },
          ]}
        />
      }
      faqs={marketerFaqs}
    />
  );
}

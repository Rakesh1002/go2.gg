import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Zap, Globe, Clock, Server, Gauge, Activity } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Edge Redirects - Lightning Fast Links",
  description:
    "Sub-10ms redirects globally with Cloudflare's edge network. 10x faster than traditional URL shorteners.",
});

const features = [
  {
    icon: Zap,
    title: "Sub-10ms Latency",
    description:
      "Your links redirect in under 10 milliseconds. No cold starts, no database lookups, just instant redirects.",
  },
  {
    icon: Globe,
    title: "310+ Edge Locations",
    description:
      "Links are served from the nearest Cloudflare data center, whether your audience is in Tokyo, London, or São Paulo.",
  },
  {
    icon: Clock,
    title: "Zero Cold Starts",
    description:
      "Unlike serverless functions, our edge workers are always warm and ready. First click is as fast as the millionth.",
  },
  {
    icon: Server,
    title: "No Database Bottleneck",
    description:
      "Link data is replicated to the edge globally. No round-trip to a central database means no latency.",
  },
  {
    icon: Gauge,
    title: "10x Faster Than Bitly",
    description:
      "Independent benchmarks show Go2 redirects are consistently 10x faster than traditional URL shorteners.",
  },
  {
    icon: Activity,
    title: "99.99% Uptime SLA",
    description:
      "Built on Cloudflare's infrastructure with automatic failover. Your links are always available.",
  },
];

const benefits = [
  "Improve conversion rates with faster redirects",
  "Reduce bounce rates from slow-loading links",
  "Better user experience on mobile networks",
  "SEO-friendly fast redirects",
  "Handle traffic spikes without degradation",
  "Global performance without configuration",
];

const faqs = [
  {
    question: "How do you achieve sub-10ms redirects?",
    answer:
      "We use Cloudflare Workers running at the edge in 310+ cities worldwide. Link data is stored in a global KV store, so lookups happen locally without network round-trips to a central database.",
  },
  {
    question: "How does this compare to Bitly or TinyURL?",
    answer:
      "Traditional shorteners run on centralized servers, adding 100-300ms of latency. Our edge architecture eliminates this entirely, making Go2 10x faster on average.",
  },
  {
    question: "Will speed vary by location?",
    answer:
      "No. Because we serve from the nearest edge location, users worldwide experience similar sub-10ms redirect times regardless of their geographic location.",
  },
  {
    question: "What happens during traffic spikes?",
    answer:
      "Cloudflare's edge network handles billions of requests per day. Your links will redirect just as fast whether you have 10 clicks or 10 million clicks.",
  },
];

// Speed Comparison Demo
function SpeedDemo() {
  return (
    <div className="p-8 md:p-12">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">
          Average Redirect Latency
        </h3>
        <p className="text-[var(--marketing-text-muted)] text-sm">
          Measured from 50 global locations
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Go2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--marketing-accent)]">Go2</span>
            <span className="font-bold font-mono text-[var(--marketing-accent)]">&lt;10ms</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
            <div className="h-full w-[5%] animate-pulse rounded-full bg-[var(--marketing-accent)]" />
          </div>
        </div>

        {/* Bitly */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--marketing-text-muted)]">Bitly</span>
            <span className="font-mono text-[var(--marketing-text-muted)]">~120ms</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
            <div className="h-full w-[60%] rounded-full bg-[var(--marketing-text-muted)]/30" />
          </div>
        </div>

        {/* TinyURL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--marketing-text-muted)]">TinyURL</span>
            <span className="font-mono text-[var(--marketing-text-muted)]">~180ms</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
            <div className="h-full w-[90%] rounded-full bg-[var(--marketing-text-muted)]/30" />
          </div>
        </div>

        {/* Short.io */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--marketing-text-muted)]">Short.io</span>
            <span className="font-mono text-[var(--marketing-text-muted)]">~150ms</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
            <div className="h-full w-[75%] rounded-full bg-[var(--marketing-text-muted)]/30" />
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[var(--marketing-text-muted)] text-xs">
        Based on third-party benchmarks measuring p50 redirect latency
      </p>
    </div>
  );
}

export default function EdgeRedirectsPage() {
  return (
    <FeaturePageTemplate
      badge="Edge-Native Speed"
      title="Lightning Fast Redirects"
      subtitle="Your links load before you can blink. Built on Cloudflare's global edge network for sub-10ms redirects anywhere on Earth."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<SpeedDemo />}
      ctaTitle="Experience the speed"
      ctaDescription="Create your first edge-powered link in seconds."
    />
  );
}

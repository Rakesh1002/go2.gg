import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { TrendingUp, DollarSign, Target, BarChart3, Zap, PieChart } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Conversion Tracking - Track What Matters",
  description:
    "Track signups, purchases, and revenue from your links. Know exactly which campaigns drive real business results.",
});

const features = [
  {
    icon: TrendingUp,
    title: "Conversion Tracking",
    description:
      "Track when clicks turn into signups, purchases, or any custom event. See the full customer journey.",
  },
  {
    icon: DollarSign,
    title: "Revenue Attribution",
    description:
      "Attribute revenue to specific links and campaigns. Know your true ROI down to the dollar.",
  },
  {
    icon: Target,
    title: "Custom Events",
    description:
      "Define your own conversion events — form submissions, video views, downloads, whatever matters to you.",
  },
  {
    icon: BarChart3,
    title: "Conversion Funnels",
    description:
      "Visualize the path from click to conversion. Identify drop-off points and optimize your funnel.",
  },
  {
    icon: Zap,
    title: "Real-Time Tracking",
    description:
      "See conversions as they happen. No waiting for reports — make decisions with live data.",
  },
  {
    icon: PieChart,
    title: "Attribution Models",
    description:
      "First-click, last-click, or linear attribution. Understand how each touchpoint contributes.",
  },
];

const benefits = [
  "Know exactly which links drive revenue",
  "Calculate true campaign ROI",
  "Optimize based on real conversions",
  "Track the full customer journey",
  "Make data-driven decisions",
  "Justify marketing spend with proof",
];

const faqs = [
  {
    question: "How do I track conversions?",
    answer:
      "Add a simple JavaScript snippet to your conversion page, or use our API to send conversion events. We'll automatically attribute them to the right links.",
  },
  {
    question: "Can I track revenue?",
    answer:
      "Yes! Pass the revenue amount with your conversion event, and we'll calculate total revenue, average order value, and ROI for each link.",
  },
  {
    question: "What attribution models do you support?",
    answer:
      "We support first-click, last-click, and linear attribution. You can view your data through any model and compare results.",
  },
  {
    question: "Does this work with my existing analytics?",
    answer:
      "Yes! Our conversion tracking works alongside Google Analytics, Mixpanel, Amplitude, or any other analytics tool you use.",
  },
];

// Conversion Dashboard Demo
function ConversionDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">
          Conversion Dashboard
        </h3>
        <p className="text-[var(--marketing-text-muted)] text-sm">Track clicks to conversions</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-text)]">45.2K</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Clicks</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-text)]">2,847</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Conversions</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-accent)]">6.3%</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Conv. Rate</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-green-500">$142K</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Revenue</div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6">
          <div className="mb-4 font-medium text-[var(--marketing-text)] text-sm">
            Conversion Funnel
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[var(--marketing-text)]">Link Clicks</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">45,200</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                <div className="h-full w-full rounded-full bg-[var(--marketing-accent)]" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[var(--marketing-text)]">Page Views</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">38,420 (85%)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                <div className="h-full w-[85%] rounded-full bg-[var(--marketing-accent)]/80" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[var(--marketing-text)]">Add to Cart</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">8,136 (18%)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                <div className="h-full w-[18%] rounded-full bg-[var(--marketing-accent)]/60" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[var(--marketing-text)]">Purchase</span>
                <span className="font-mono text-[var(--marketing-accent)]">2,847 (6.3%)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--marketing-bg-elevated)]">
                <div className="h-full w-[6.3%] rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Converting Links */}
        <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6">
          <div className="mb-4 font-medium text-[var(--marketing-text)] text-sm">
            Top Converting Links
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div>
                <div className="font-mono text-[var(--marketing-accent)] text-sm">go2.gg/sale</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">
                  Summer Sale Campaign
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-500 text-sm">8.2%</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">$52,400</div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div>
                <div className="font-mono text-[var(--marketing-accent)] text-sm">
                  go2.gg/launch
                </div>
                <div className="text-[var(--marketing-text-muted)] text-xs">Product Launch</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-500 text-sm">7.1%</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">$38,200</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversionsPage() {
  return (
    <FeaturePageTemplate
      badge="Revenue Attribution"
      title="Track What Actually Matters"
      subtitle="See exactly how clicks turn into signups, purchases, and revenue. Know your true ROI and optimize what works."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<ConversionDemo />}
      ctaTitle="Start tracking conversions"
      ctaDescription="Know exactly which links drive your business."
      agentCallout={{
        title: "Conversions roll back to the run that minted the link.",
        body:
          "When a click on an agent-created link converts, the conversion event inherits the agent context (agent_id, agent_run_id, agent_actor_id, agent_tool_call_id). So you can answer questions like 'which Claude run drove revenue last week?' or 'which prompt template produced more signups?' — without rebuilding attribution from logs.",
        primitive: "POST /api/v1/conversions · conversion.agentRunId",
      }}
    />
  );
}

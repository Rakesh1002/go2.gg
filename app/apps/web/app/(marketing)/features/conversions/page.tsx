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
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">
          Conversion Dashboard
        </h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">Track clicks to conversions</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-text)]">45.2K</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Clicks</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-text)]">2,847</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Conversions</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-accent)]">6.3%</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Conv. Rate</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-green-500">$142K</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Revenue</div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Conversion Funnel
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--marketing-text)]">Link Clicks</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">45,200</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--marketing-bg-elevated)] overflow-hidden">
                <div className="h-full w-full bg-[var(--marketing-accent)] rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--marketing-text)]">Page Views</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">38,420 (85%)</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--marketing-bg-elevated)] overflow-hidden">
                <div className="h-full w-[85%] bg-[var(--marketing-accent)]/80 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--marketing-text)]">Add to Cart</span>
                <span className="font-mono text-[var(--marketing-text-muted)]">8,136 (18%)</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--marketing-bg-elevated)] overflow-hidden">
                <div className="h-full w-[18%] bg-[var(--marketing-accent)]/60 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--marketing-text)]">Purchase</span>
                <span className="font-mono text-[var(--marketing-accent)]">2,847 (6.3%)</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--marketing-bg-elevated)] overflow-hidden">
                <div className="h-full w-[6.3%] bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Converting Links */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Top Converting Links
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div>
                <div className="font-mono text-sm text-[var(--marketing-accent)]">go2.gg/sale</div>
                <div className="text-xs text-[var(--marketing-text-muted)]">
                  Summer Sale Campaign
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-500">8.2%</div>
                <div className="text-xs text-[var(--marketing-text-muted)]">$52,400</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div>
                <div className="font-mono text-sm text-[var(--marketing-accent)]">
                  go2.gg/launch
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)]">Product Launch</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-500">7.1%</div>
                <div className="text-xs text-[var(--marketing-text-muted)]">$38,200</div>
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
    />
  );
}

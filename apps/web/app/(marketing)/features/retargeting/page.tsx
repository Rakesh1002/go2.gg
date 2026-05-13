import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Target, Facebook, Linkedin, Eye, BarChart3, Zap } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Retargeting Pixels - Build Audiences from Every Click",
  description:
    "Add Facebook, Google, TikTok, and LinkedIn pixels to your links. Build retargeting audiences from every click.",
});

const features = [
  {
    icon: Facebook,
    title: "Meta Pixel Integration",
    description:
      "Add Facebook and Instagram pixels to any link. Build custom audiences for your ad campaigns.",
  },
  {
    icon: Target,
    title: "Google Ads Remarketing",
    description: "Fire Google Ads tags on every click. Create remarketing lists automatically.",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Insight Tag",
    description:
      "Track B2B audiences with LinkedIn pixels. Retarget professionals who clicked your links.",
  },
  {
    icon: Eye,
    title: "TikTok Pixel",
    description:
      "Reach younger audiences with TikTok pixel integration. Track conversions from viral content.",
  },
  {
    icon: BarChart3,
    title: "Conversion Tracking",
    description:
      "Attribute conversions back to specific links. Know exactly which campaigns drive results.",
  },
  {
    icon: Zap,
    title: "No Page Needed",
    description:
      "Fire pixels without owning the destination page. Build audiences from any link you share.",
  },
];

const benefits = [
  "Build audiences from every link click",
  "Retarget visitors across all platforms",
  "No landing page required",
  "Track conversions accurately",
  "Reduce customer acquisition costs",
  "Unify tracking across campaigns",
];

const faqs = [
  {
    question: "Which ad platforms do you support?",
    answer:
      "We support Meta (Facebook/Instagram), Google Ads, LinkedIn, TikTok, Twitter/X, Pinterest, and custom pixels via Google Tag Manager.",
  },
  {
    question: "Does this work if I don't own the destination page?",
    answer:
      "Yes! Pixels fire during the redirect, so you can build audiences even when linking to external sites you don't control.",
  },
  {
    question: "Will pixels slow down redirects?",
    answer:
      "No. Pixels are fired asynchronously after the redirect completes, so there's no impact on redirect speed.",
  },
  {
    question: "Can I add multiple pixels to one link?",
    answer:
      "Absolutely. Add as many pixels as you need — Facebook, Google, LinkedIn, and more on the same link.",
  },
];

// Retargeting Demo
function RetargetingDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">
          Pixel Management
        </h3>
        <p className="text-[var(--marketing-text-muted)] text-sm">
          Add tracking pixels to any link
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Active Pixels */}
        <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4">
          <div className="mb-4 font-medium text-[var(--marketing-text)] text-sm">
            Active Pixels for go2.gg/promo
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <Facebook className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">Meta Pixel</div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">ID: 123456789</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-green-500 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">Google Ads</div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">AW-987654321</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-green-500 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2]">
                  <Linkedin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">
                    LinkedIn Insight
                  </div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">
                    Partner ID: 456789
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-green-500 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-text)]">12.4K</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Pixels Fired</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-text)]">8.2K</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Unique Users</div>
          </div>
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 text-center">
            <div className="font-bold text-2xl text-[var(--marketing-accent)]">342</div>
            <div className="text-[var(--marketing-text-muted)] text-xs">Conversions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RetargetingPage() {
  return (
    <FeaturePageTemplate
      badge="Audience Building"
      title="Retarget Every Click"
      subtitle="Add Facebook, Google, TikTok, and LinkedIn pixels to your links. Build audiences and track conversions without owning the destination."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<RetargetingDemo />}
      ctaTitle="Start building audiences"
      ctaDescription="Add your first pixel and start retargeting today."
      agentCallout={{
        title: "Pixels fire on agent-created links the same as on yours.",
        body:
          "Configure pixels (Meta, Google, LinkedIn, TikTok, Pinterest, Twitter, GA4, custom) on your workspace once. Every link an agent creates serves the same pixel stack on the redirect interstitial — with GDPR consent mode honored. So the audience an agent's link builds is your audience, in your ad accounts, not the agent vendor's.",
        primitive: "trackingPixels table · per-link pixel toggle · consent mode",
      }}
    />
  );
}

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
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">
          Pixel Management
        </h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">
          Add tracking pixels to any link
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Active Pixels */}
        <div className="p-4 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Active Pixels for go2.gg/promo
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Facebook className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">Meta Pixel</div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">ID: 123456789</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Active
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">Google Ads</div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">AW-987654321</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Active
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">
                    LinkedIn Insight
                  </div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">
                    Partner ID: 456789
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-text)]">12.4K</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Pixels Fired</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-text)]">8.2K</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Unique Users</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-center">
            <div className="text-2xl font-bold text-[var(--marketing-accent)]">342</div>
            <div className="text-xs text-[var(--marketing-text-muted)]">Conversions</div>
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
    />
  );
}

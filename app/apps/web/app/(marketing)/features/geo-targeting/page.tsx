import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { MapPin, Smartphone, Globe, Target, Settings, BarChart3 } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Geo Targeting & Device Routing",
  description:
    "Route visitors by country, device, or operating system. Send iPhone users to App Store, Android to Play Store automatically.",
});

const features = [
  {
    icon: MapPin,
    title: "Country-Based Routing",
    description:
      "Send visitors to different destinations based on their country. Perfect for localized landing pages and regional offers.",
  },
  {
    icon: Smartphone,
    title: "Device Detection",
    description:
      "Automatically detect iOS, Android, Windows, and Mac. Route users to the right app store or platform-specific page.",
  },
  {
    icon: Globe,
    title: "Language Targeting",
    description:
      "Redirect based on browser language settings to deliver content in your visitor's preferred language.",
  },
  {
    icon: Target,
    title: "OS-Specific Routing",
    description:
      "Different download links for different operating systems. One link works everywhere.",
  },
  {
    icon: Settings,
    title: "Fallback Rules",
    description:
      "Set default destinations for unmatched conditions. Never leave a visitor without somewhere to go.",
  },
  {
    icon: BarChart3,
    title: "Routing Analytics",
    description:
      "See exactly how traffic splits across different routes. Optimize based on real data.",
  },
];

const benefits = [
  "One link for all app store downloads",
  "Localized experiences without complexity",
  "Higher conversion with relevant content",
  "Simplified marketing campaigns",
  "No manual link management per region",
  "A/B test different destinations",
];

const faqs = [
  {
    question: "How do you detect the user's location?",
    answer:
      "We use Cloudflare's edge network which provides accurate geolocation data based on the user's IP address. This happens at the edge for zero latency impact.",
  },
  {
    question: "Can I target specific cities or regions?",
    answer:
      "Yes! You can target by country, state/region, or even city level for precise geographic targeting.",
  },
  {
    question: "What if a user is using a VPN?",
    answer:
      "VPN users will be routed based on their VPN exit location. You can set fallback rules to handle edge cases.",
  },
  {
    question: "Can I combine geo and device targeting?",
    answer:
      "Absolutely! Create rules like 'iPhone users in Germany' or 'Android users in the US' for precise targeting.",
  },
];

// Geo Targeting Demo
function GeoTargetingDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">
          Smart Link Routing
        </h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">
          One link, multiple destinations
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Main Link */}
        <div className="p-4 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/30 mb-6 text-center">
          <div className="text-sm text-[var(--marketing-text-muted)] mb-1">Your smart link</div>
          <div className="font-mono text-lg font-semibold text-[var(--marketing-accent)]">
            go2.gg/app
          </div>
        </div>

        {/* Routing Rules */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--marketing-text)]">iOS Users</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">→ apps.apple.com/app</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.341c-.5 0-.998-.103-1.457-.31l-2.24-1.012a1.8 1.8 0 01-.95-1.022l-.7-2.1a.6.6 0 00-.57-.407.6.6 0 00-.57.407l-.7 2.1a1.8 1.8 0 01-.95 1.022l-2.24 1.012c-.459.207-.957.31-1.457.31A3.98 3.98 0 012 11.65V4.009a2 2 0 012-2h16a2 2 0 012 2v7.64a3.98 3.98 0 01-4.477 3.692z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--marketing-text)]">Android Users</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">
                → play.google.com/app
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--marketing-text)]">EU Visitors</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">→ eu.example.com</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)] opacity-60">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Settings className="h-5 w-5 text-[var(--marketing-text-muted)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--marketing-text-muted)]">
                Everyone Else
              </div>
              <div className="text-xs text-[var(--marketing-text-muted)]">→ example.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeoTargetingPage() {
  return (
    <FeaturePageTemplate
      badge="Smart Routing"
      title="Right Destination, Every Time"
      subtitle="Route visitors based on their location, device, or platform. One link that works perfectly for everyone, everywhere."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<GeoTargetingDemo />}
      ctaTitle="Start routing smarter"
      ctaDescription="Create your first smart link with geo targeting."
    />
  );
}

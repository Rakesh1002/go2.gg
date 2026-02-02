import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { ArrowRightLeft, Upload, Check, Zap, Shield, Clock } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Migration Tools - Switch in Seconds",
  description:
    "Import from Bitly, Rebrandly, Short.io, or any other URL shortener. We make switching painless.",
});

const features = [
  {
    icon: ArrowRightLeft,
    title: "One-Click Import",
    description:
      "Connect your existing Bitly, Rebrandly, or Short.io account and import all your links automatically.",
  },
  {
    icon: Upload,
    title: "CSV Import",
    description:
      "Using a different service? Export to CSV and upload to Go2. We'll map your data automatically.",
  },
  {
    icon: Check,
    title: "Preserve Everything",
    description:
      "Analytics history, tags, custom slugs — we bring it all over. Nothing gets lost in the migration.",
  },
  {
    icon: Zap,
    title: "Instant Redirects",
    description:
      "Once imported, your links work immediately on Go2's edge network. Zero downtime migration.",
  },
  {
    icon: Shield,
    title: "Redirect Forwarding",
    description:
      "Keep your old short URLs working. Set up redirect rules from your old domain to Go2.",
  },
  {
    icon: Clock,
    title: "Migration Support",
    description:
      "Our team helps with complex migrations. Enterprise customers get dedicated migration assistance.",
  },
];

const benefits = [
  "No disruption to existing links",
  "Keep all your analytics data",
  "Preserve custom slugs and tags",
  "Fast, automated import process",
  "Dedicated support for large migrations",
  "Compare before you commit",
];

const faqs = [
  {
    question: "Which URL shorteners can I migrate from?",
    answer:
      "We support direct import from Bitly, Rebrandly, Short.io, and TinyURL. For any other service, you can use CSV import.",
  },
  {
    question: "Will my existing short links break?",
    answer:
      "No. We help you set up redirect forwarding so your old links continue to work while you transition.",
  },
  {
    question: "How long does migration take?",
    answer:
      "Most migrations complete in minutes. Large accounts with millions of links may take a few hours.",
  },
  {
    question: "Do you preserve analytics history?",
    answer:
      "Yes, we import your historical click data when available from the source platform's API.",
  },
];

// Migration Demo
function MigrationDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">
          Migration Wizard
        </h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">Import your links in minutes</p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Source Selection */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">Select Source</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border-2 border-[var(--marketing-accent)] bg-[var(--marketing-accent)]/5 cursor-pointer">
              <div className="text-lg font-bold text-[var(--marketing-text)] mb-1">Bitly</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">Direct API import</div>
            </div>
            <div className="p-4 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] cursor-pointer hover:border-[var(--marketing-accent)]/30">
              <div className="text-lg font-bold text-[var(--marketing-text)] mb-1">Rebrandly</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">Direct API import</div>
            </div>
            <div className="p-4 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] cursor-pointer hover:border-[var(--marketing-accent)]/30">
              <div className="text-lg font-bold text-[var(--marketing-text)] mb-1">Short.io</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">Direct API import</div>
            </div>
            <div className="p-4 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] cursor-pointer hover:border-[var(--marketing-accent)]/30">
              <div className="text-lg font-bold text-[var(--marketing-text)] mb-1">CSV File</div>
              <div className="text-xs text-[var(--marketing-text-muted)]">Any other service</div>
            </div>
          </div>
        </div>

        {/* Import Progress */}
        <div className="p-6 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Import Progress
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Connected to Bitly
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Found 2,456 links
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--marketing-accent)] flex items-center justify-center animate-pulse">
                <ArrowRightLeft className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Importing links...
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--marketing-bg-elevated)] overflow-hidden">
                  <div className="h-full w-[67%] bg-[var(--marketing-accent)] rounded-full animate-pulse" />
                </div>
                <div className="text-xs text-[var(--marketing-text-muted)] mt-1">
                  1,647 / 2,456 imported
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--marketing-border)] flex items-center justify-center">
                <span className="text-xs text-[var(--marketing-text-muted)]">4</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Import analytics
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--marketing-border)] flex items-center justify-center">
                <span className="text-xs text-[var(--marketing-text-muted)]">5</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--marketing-text)]">
                  Verify and complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MigrationPage() {
  return (
    <FeaturePageTemplate
      badge="Easy Migration"
      title="Switch in Seconds"
      subtitle="Moving from Bitly, Rebrandly, or Short.io? Import all your links with one click. We make switching painless."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<MigrationDemo />}
      ctaTitle="Ready to switch?"
      ctaDescription="Import your links and experience the Go2 difference."
    />
  );
}

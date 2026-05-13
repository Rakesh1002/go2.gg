import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Globe, Lock, Zap, Settings, Shield, Check } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";
import { ComparisonWidget } from "@/components/marketing/sections/comparison-widget";
import { MigrationCTA } from "@/components/marketing/sections/migration-cta";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Custom Domains - Free on All Plans",
  description:
    "Use your own branded domain for short links. Free on all plans (Bitly charges $29/mo). Automatic SSL, instant setup.",
});

const features = [
  {
    icon: Globe,
    title: "Your Domain, Your Brand",
    description:
      "Use yourbrand.co instead of go2.gg. Branded links get up to 34% higher click-through rates. Free on all plans.",
  },
  {
    icon: Lock,
    title: "Automatic SSL/HTTPS",
    description:
      "We provision and auto-renew SSL certificates. Your branded links are always secure. Zero maintenance.",
  },
  {
    icon: Zap,
    title: "5-Minute Setup",
    description:
      "Add one DNS record and you're live. Edge-native verification is instant. No waiting for propagation.",
  },
  {
    icon: Settings,
    title: "Root & 404 Control",
    description:
      "Set where brand.co redirects. Customize 404 pages. Keep lost visitors in your ecosystem.",
  },
  {
    icon: Shield,
    title: "Secure Verification",
    description:
      "DNS verification ensures only you can use your domain. We prevent hijacking and impersonation.",
  },
  {
    icon: Check,
    title: "Unlimited Domains",
    description:
      "Add as many custom domains as you need. Subdomains too. No per-domain fees. Ever.",
  },
];

const benefits = [
  "Free on all plans (Bitly charges $29/mo per domain)",
  "34% higher CTR with branded links",
  "Unlimited domains — no per-domain fees",
  "Automatic SSL certificate management",
  "Setup in 5 minutes, not 5 days",
  "Works with any registrar (GoDaddy, Namecheap, etc.)",
  "Subdomains supported (link.brand.co, go.brand.co)",
  "Full analytics per domain",
];

const faqs = [
  {
    question: "Is custom domains really free?",
    answer:
      "Yes, custom domains are free on all plans including Free tier. Bitly charges $29/mo for this feature. Rebrandly charges $25/mo. We believe branded links should be accessible to everyone.",
  },
  {
    question: "Can I use a subdomain like link.mybrand.com?",
    answer:
      "Yes! We actually recommend subdomains. They're easier to set up (one CNAME record) and let you keep your apex domain for your main website.",
  },
  {
    question: "How many custom domains can I add?",
    answer:
      "Unlimited. Add as many domains and subdomains as you need. There are no per-domain fees on any plan.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Usually under 5 minutes. Add the DNS record, click verify, and you're live. Our edge network picks up changes almost instantly.",
  },
];

// Visual Comparison Demo
function DomainComparisonDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 md:flex-row md:p-12">
      {/* Before */}
      <div className="w-full max-w-sm rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6 opacity-60">
        <div className="mb-4 text-center font-semibold text-[var(--marketing-text-muted)] text-sm">
          Generic Shortener
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Globe className="h-4 w-4 text-gray-500" />
          </div>
          <div className="font-mono text-[var(--marketing-text-muted)] text-sm">go2.gg/Xy7z9A</div>
        </div>
      </div>

      <div className="font-bold text-[var(--marketing-text-muted)] text-xl">VS</div>

      {/* After */}
      <div className="relative w-full max-w-sm rounded-xl border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg-elevated)] p-6 shadow-[var(--marketing-accent)]/10 shadow-xl">
        <div className="-top-3 -translate-x-1/2 absolute left-1/2 rounded-full bg-[var(--marketing-accent)] px-3 py-1 font-bold text-white text-xs">
          Trusted & Branded
        </div>
        <div className="mb-4 text-center font-semibold text-[var(--marketing-accent)] text-sm">
          Custom Domain
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--marketing-accent)]/30 bg-[var(--marketing-bg)] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
            <Globe className="h-4 w-4 text-[var(--marketing-accent)]" />
          </div>
          <div className="font-medium font-mono text-[var(--marketing-text)] text-sm">
            brand.co/summer-sale
          </div>
        </div>
      </div>
    </div>
  );
}

const domainSetupSteps = [
  {
    step: 1,
    title: "Add your domain",
    description:
      "Enter your custom domain or subdomain in the Go2 dashboard. We recommend subdomains like link.yourbrand.com.",
  },
  {
    step: 2,
    title: "Update DNS",
    description:
      "Add a single CNAME record pointing to Go2. We provide the exact record to copy-paste.",
  },
  {
    step: 3,
    title: "Verify & go live",
    description:
      "Click verify — we check DNS instantly. SSL is provisioned automatically. Start creating branded links.",
  },
];

export default function CustomDomainsPage() {
  return (
    <FeaturePageTemplate
      badge="Free on All Plans"
      title="Stop Paying for Branded Links"
      subtitle="Custom domains are free on Go2 — including Free tier. Bitly charges $29/mo. Get branded links that boost CTR by 34%, with automatic SSL and 5-minute setup."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<DomainComparisonDemo />}
      ctaTitle="Add your domain for free"
      ctaDescription="No credit card required. Set up in 5 minutes."
      agentCallout={{
        title: "Agents inherit your domain. Links come out as yourbrand.com/x.",
        body:
          "When your agent creates a link via MCP or REST, it doesn't choose the domain — it inherits the workspace default. So a link minted by a Claude run lands on yourbrand.com, not go2.gg, with no extra parameters and no extra prompting required. Switch your default domain once; every agent on the workspace picks up the change.",
        primitive: "POST /api/v1/links · workspace.defaultDomainId",
      }}
      comparisonWidget={
        <ComparisonWidget
          feature="Custom Domains"
          headline="Why pay for branded links?"
          go2={{ value: "Free", highlight: true }}
          competitors={[
            { name: "Bitly", value: "$29/mo" },
            { name: "Rebrandly", value: "$25/mo" },
            { name: "TinyURL", value: "Not available" },
          ]}
        />
      }
      howItWorks={
        <HowItWorks
          headline="Set up in 5 minutes"
          subheadline="Three simple steps to branded links"
          steps={domainSetupSteps}
        />
      }
      migrationCta={
        <MigrationCTA
          competitor="Bitly"
          headline="Already have a custom domain on Bitly?"
          description="Migrate your domain to Go2 in minutes. Keep your existing links working with our redirect preservation."
          features={[
            "Import your domain with one click",
            "Redirect existing Bitly links automatically",
            "Save $348/year on domain fees",
          ]}
        />
      }
    />
  );
}

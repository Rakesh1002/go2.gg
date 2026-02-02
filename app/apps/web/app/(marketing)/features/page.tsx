import type { Metadata } from "next";
import {
  Zap,
  Globe,
  BarChart3,
  QrCode,
  Link as LinkIcon,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Shield,
  Webhook,
  Check,
  ArrowRight,
} from "lucide-react";
import { getMetadata } from "@repo/config";
import { BackgroundGrid } from "@/components/marketing/decorative/background-grid";
import { GradientText } from "@/components/ui/gradient-text";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { CTA } from "@/components/marketing/sections";
import Link from "next/link";

export const metadata: Metadata = getMetadata({
  title: "Features",
  description:
    "Explore Go2's powerful URL shortener features: edge-native redirects, custom domains, real-time analytics, QR codes, and more.",
});

// Simple feature card component
function FeatureCard({
  title,
  description,
  icon,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <div className="group relative rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-all hover:-translate-y-1 h-full flex flex-col">
      <div className="h-12 w-12 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 flex items-center justify-center mb-4 group-hover:bg-[var(--marketing-accent)] group-hover:border-[var(--marketing-accent)] transition-colors">
        <div className="text-[var(--marketing-accent)] group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--marketing-text)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--marketing-text-muted)] mb-4 flex-grow">
        {description}
      </p>
      {children && (
        <div className="rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)] p-4 min-h-[120px] flex items-center justify-center">
          {children}
        </div>
      )}
      {href && (
        <div className="mt-4 flex items-center text-sm font-medium text-[var(--marketing-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Feature list item
function FeatureListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-[var(--marketing-text-muted)]">
      <Check className="h-4 w-4 text-[var(--marketing-accent)] flex-shrink-0" />
      {children}
    </li>
  );
}

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <BackgroundGrid className="opacity-50" color="var(--marketing-border)" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />

        <div className="max-w-7xl mx-auto relative px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Zap className="h-4 w-4" />
            Powerful Capabilities
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            Everything you need to{" "}
            <GradientText variant="brand" animate className="font-extrabold">
              command
            </GradientText>{" "}
            your links.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Go2 isn't just a shortener. It's an enterprise-grade link management
            platform with edge-native speed, deep analytics, and AI-driven
            insights.
          </p>
        </div>
      </section>

      {/* Core Features - Grid Layout */}
      <section className="py-12 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl mb-4">
            The Essentials
          </h2>
          <p className="text-lg text-[var(--marketing-text-muted)] max-w-2xl">
            The core building blocks that make Go2 the fastest link platform on
            earth.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="Lightning Fast"
            description="10ms redirects powered by edge computing. Your links load before you can blink."
            icon={<Zap className="h-6 w-6" />}
            href="/features/edge-redirects"
          >
            <div className="flex items-center gap-2 text-[var(--marketing-accent)]">
              <Zap className="h-5 w-5 fill-current" />
              <span className="font-bold text-xl">10ms</span>
            </div>
          </FeatureCard>

          <FeatureCard
            title="Custom Domains"
            description="Use your own domain like links.brand.com. Free on every plan."
            icon={<Globe className="h-6 w-6" />}
            href="/features/custom-domains"
          >
            <div className="text-sm font-medium text-[var(--marketing-text)]">
              links.<span className="text-[var(--marketing-accent)]">brand</span>.com
            </div>
          </FeatureCard>

          <FeatureCard
            title="Real-time Analytics"
            description="See who's clicking, where from, and what devices in real-time."
            icon={<BarChart3 className="h-6 w-6" />}
            href="/features/analytics"
          >
            <div className="flex items-end gap-1 h-12">
              <div className="w-3 bg-[var(--marketing-accent)]/30 rounded-t h-4" />
              <div className="w-3 bg-[var(--marketing-accent)]/50 rounded-t h-6" />
              <div className="w-3 bg-[var(--marketing-accent)]/70 rounded-t h-8" />
              <div className="w-3 bg-[var(--marketing-accent)] rounded-t h-12" />
              <div className="w-3 bg-[var(--marketing-accent)]/80 rounded-t h-10" />
            </div>
          </FeatureCard>

          <FeatureCard
            title="Beautiful QR Codes"
            description="Create stunning AI-generated QR codes that match your brand."
            icon={<QrCode className="h-6 w-6" />}
            href="/features/qr-codes"
          >
            <div className="w-16 h-16 grid grid-cols-4 gap-0.5">
              {[...Array(16)].map((_, i) => (
                <div
                  key={`qr-cell-${i}`}
                  className={`rounded-sm ${
                    [0, 1, 4, 5, 2, 3, 8, 12, 13, 15].includes(i)
                      ? "bg-[var(--marketing-text)]"
                      : "bg-[var(--marketing-text)]/20"
                  }`}
                />
              ))}
            </div>
          </FeatureCard>
        </div>
      </section>

      {/* Power Features Section */}
      <section className="py-24 relative border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 text-sm font-semibold text-[var(--marketing-accent)] mb-4">
              Advanced
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl md:text-5xl">
              Power Features
            </h2>
            <p className="mt-4 text-lg text-[var(--marketing-text-muted)] max-w-2xl mx-auto">
              Tools designed for growth marketers and power users who need more
              control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Link Management */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center">
                  <LinkIcon className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  Organize Your Links
                </h3>
                <p className="text-[var(--marketing-text-muted)] mb-4">
                  Keep your workspace tidy with tags, folders, and custom names.
                  Add expiration dates, click limits, or password protection.
                </p>
                <ul className="space-y-2">
                  <FeatureListItem>Advanced filtering and search</FeatureListItem>
                  <FeatureListItem>Password protection</FeatureListItem>
                  <FeatureListItem>Link expiration & cloaking</FeatureListItem>
                </ul>
              </div>
            </div>

            {/* Smart Routing */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center">
                  <MapPin className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  Smart Routing
                </h3>
                <p className="text-[var(--marketing-text-muted)] mb-4">
                  Direct traffic to the right destination based on user context.
                  Send iOS users to App Store, Android to Google Play.
                </p>
                <ul className="space-y-2">
                  <FeatureListItem>Device-based routing (iOS/Android)</FeatureListItem>
                  <FeatureListItem>Geo-targeting by country</FeatureListItem>
                  <FeatureListItem>Language-based redirects</FeatureListItem>
                </ul>
              </div>
            </div>

            {/* Retargeting */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center">
                  <Target className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  Retarget Your Visitors
                </h3>
                <p className="text-[var(--marketing-text-muted)] mb-4">
                  Never lose a lead. Add Facebook, Google, TikTok, and LinkedIn
                  pixels to build custom audiences from every click.
                </p>
                <ul className="space-y-2">
                  <FeatureListItem>Support for 5+ ad platforms</FeatureListItem>
                  <FeatureListItem>Build custom audiences</FeatureListItem>
                  <FeatureListItem>No coding required</FeatureListItem>
                </ul>
              </div>
            </div>

            {/* Conversions */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  Track What Matters
                </h3>
                <p className="text-[var(--marketing-text-muted)] mb-4">
                  Go beyond clicks. Track conversions and revenue to understand
                  the real business impact of your links.
                </p>
                <ul className="space-y-2">
                  <FeatureListItem>Conversion tracking</FeatureListItem>
                  <FeatureListItem>Revenue attribution</FeatureListItem>
                  <FeatureListItem>Custom event tracking</FeatureListItem>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl">
              Built for Scale
            </h2>
            <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">
              Enterprise-grade security and collaboration features for growing
              teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Team */}
            <div className="relative group rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 hover:border-[var(--marketing-accent)]/30 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center mb-6 group-hover:bg-[var(--marketing-accent)] group-hover:text-white group-hover:border-[var(--marketing-accent)] transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-3">
                Built for Teams
              </h3>
              <p className="text-[var(--marketing-text-muted)] mb-6">
                Invite your team, manage permissions, and collaborate on link
                campaigns together.
              </p>
              <div className="h-24 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)] flex items-center justify-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={`team-member-${i}`}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
                    >
                      <Users className="w-3 h-3 text-gray-500" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[var(--marketing-accent)] flex items-center justify-center text-white text-xs font-bold">
                    +5
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="relative group rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 hover:border-[var(--marketing-accent)]/30 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center mb-6 group-hover:bg-[var(--marketing-accent)] group-hover:text-white group-hover:border-[var(--marketing-accent)] transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-3">
                Enterprise Security
              </h3>
              <p className="text-[var(--marketing-text-muted)] mb-6">
                SSO, 2FA, and SOC 2 compliance features to keep your data and
                users safe.
              </p>
              <div className="h-24 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)] flex items-center justify-center">
                <div className="relative">
                  <Shield className="w-12 h-12 text-[var(--marketing-accent)]/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-5 h-5 text-[var(--marketing-accent)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Webhooks/API */}
            <div className="relative group rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 hover:border-[var(--marketing-accent)]/30 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] flex items-center justify-center mb-6 group-hover:bg-[var(--marketing-accent)] group-hover:text-white group-hover:border-[var(--marketing-accent)] transition-colors">
                <Webhook className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-3">
                API & Webhooks
              </h3>
              <p className="text-[var(--marketing-text-muted)] mb-6">
                Connect to Slack, Zapier, or build custom integrations with our
                robust API.
              </p>
              <div className="h-24 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)] flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--marketing-accent)]/10 border border-[var(--marketing-accent)]/30 flex items-center justify-center">
                    <Webhook className="w-4 h-4 text-[var(--marketing-accent)]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-0.5 bg-[var(--marketing-accent)]" />
                    <div className="w-2 h-0.5 bg-[var(--marketing-accent)]" />
                    <div className="w-2 h-0.5 bg-[var(--marketing-accent)]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded bg-gray-200" />
                    <div className="w-5 h-5 rounded bg-gray-200" />
                    <div className="w-5 h-5 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA
        headline="Ready to experience the edge?"
        description="Join thousands of developers and teams who trust Go2 for their most critical links."
      />
    </div>
  );
}

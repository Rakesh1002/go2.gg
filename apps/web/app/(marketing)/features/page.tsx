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
    <div className="group hover:-translate-y-1 relative flex h-full flex-col rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-all hover:border-[var(--marketing-accent)]/30">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 transition-colors group-hover:border-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)]">
        <div className="text-[var(--marketing-accent)] transition-colors group-hover:text-white">
          {icon}
        </div>
      </div>
      <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-lg">
        {title}
      </h3>
      <p className="mb-4 flex-grow text-[var(--marketing-text-muted)] text-sm">
        {description}
      </p>
      {children && (
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4">
          {children}
        </div>
      )}
      {href && (
        <div className="mt-4 flex items-center font-medium text-[var(--marketing-accent)] text-sm opacity-0 transition-opacity group-hover:opacity-100">
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
    <li className="flex items-center gap-2 text-[var(--marketing-text-muted)] text-sm">
      <Check className="h-4 w-4 flex-shrink-0 text-[var(--marketing-accent)]" />
      {children}
    </li>
  );
}

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <BackgroundGrid className="opacity-50" color="var(--marketing-border)" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Zap className="h-4 w-4" />
            Powerful Capabilities
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Everything you need to{" "}
            <GradientText variant="brand" animate className="font-extrabold">
              command
            </GradientText>{" "}
            your links.
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            Go2 isn't just a shortener. It's an enterprise-grade link management
            platform with edge-native speed, deep analytics, and AI-driven
            insights.
          </p>
        </div>
      </section>

      {/* Core Features - Grid Layout */}
      <section className="relative py-12 md:py-24">
        <div className="mx-auto mb-16 max-w-7xl px-4">
          <h2 className="mb-4 font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl">
            The Essentials
          </h2>
          <p className="max-w-2xl text-[var(--marketing-text-muted)] text-lg">
            The core building blocks that make Go2 the fastest link platform on
            earth.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="font-medium text-[var(--marketing-text)] text-sm">
              links.<span className="text-[var(--marketing-accent)]">brand</span>.com
            </div>
          </FeatureCard>

          <FeatureCard
            title="Real-time Analytics"
            description="See who's clicking, where from, and what devices in real-time."
            icon={<BarChart3 className="h-6 w-6" />}
            href="/features/analytics"
          >
            <div className="flex h-12 items-end gap-1">
              <div className="h-4 w-3 rounded-t bg-[var(--marketing-accent)]/30" />
              <div className="h-6 w-3 rounded-t bg-[var(--marketing-accent)]/50" />
              <div className="h-8 w-3 rounded-t bg-[var(--marketing-accent)]/70" />
              <div className="h-12 w-3 rounded-t bg-[var(--marketing-accent)]" />
              <div className="h-10 w-3 rounded-t bg-[var(--marketing-accent)]/80" />
            </div>
          </FeatureCard>

          <FeatureCard
            title="Beautiful QR Codes"
            description="Create stunning AI-generated QR codes that match your brand."
            icon={<QrCode className="h-6 w-6" />}
            href="/features/qr-codes"
          >
            <div className="grid h-16 w-16 grid-cols-4 gap-0.5">
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
      <section className="relative border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30 py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 font-semibold text-[var(--marketing-accent)] text-sm">
              Advanced
            </div>
            <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-5xl">
              Power Features
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--marketing-text-muted)] text-lg">
              Tools designed for growth marketers and power users who need more
              control.
            </p>
          </div>

          <div className="mb-16 grid gap-12 md:grid-cols-2">
            {/* Link Management */}
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                  <LinkIcon className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  Organize Your Links
                </h3>
                <p className="mb-4 text-[var(--marketing-text-muted)]">
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
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                  <MapPin className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  Smart Routing
                </h3>
                <p className="mb-4 text-[var(--marketing-text-muted)]">
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
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                  <Target className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  Retarget Your Visitors
                </h3>
                <p className="mb-4 text-[var(--marketing-text-muted)]">
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
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  Track What Matters
                </h3>
                <p className="mb-4 text-[var(--marketing-text-muted)]">
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
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl">
              Built for Scale
            </h2>
            <p className="mt-4 text-[var(--marketing-text-muted)] text-lg">
              Enterprise-grade security and collaboration features for growing
              teams.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Team */}
            <div className="group hover:-translate-y-1 relative rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:border-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl">
                Built for Teams
              </h3>
              <p className="mb-6 text-[var(--marketing-text-muted)]">
                Invite your team, manage permissions, and collaborate on link
                campaigns together.
              </p>
              <div className="flex h-24 items-center justify-center rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
                <div className="-space-x-2 flex">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={`team-member-${i}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200"
                    >
                      <Users className="h-3 w-3 text-gray-500" />
                    </div>
                  ))}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--marketing-accent)] font-bold text-white text-xs">
                    +5
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="group hover:-translate-y-1 relative rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:border-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl">
                Enterprise Security
              </h3>
              <p className="mb-6 text-[var(--marketing-text-muted)]">
                SSO, 2FA, and SOC 2 compliance features to keep your data and
                users safe.
              </p>
              <div className="flex h-24 items-center justify-center rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
                <div className="relative">
                  <Shield className="h-12 w-12 text-[var(--marketing-accent)]/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-5 w-5 text-[var(--marketing-accent)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Webhooks/API */}
            <div className="group hover:-translate-y-1 relative rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:border-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                <Webhook className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl">
                API & Webhooks
              </h3>
              <p className="mb-6 text-[var(--marketing-text-muted)]">
                Connect to Slack, Zapier, or build custom integrations with our
                robust API.
              </p>
              <div className="flex h-24 items-center justify-center rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/10">
                    <Webhook className="h-4 w-4 text-[var(--marketing-accent)]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-0.5 w-2 bg-[var(--marketing-accent)]" />
                    <div className="h-0.5 w-2 bg-[var(--marketing-accent)]" />
                    <div className="h-0.5 w-2 bg-[var(--marketing-accent)]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-5 w-5 rounded bg-gray-200" />
                    <div className="h-5 w-5 rounded bg-gray-200" />
                    <div className="h-5 w-5 rounded bg-gray-200" />
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

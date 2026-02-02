import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, siteConfig } from "@repo/config";
import { Handshake, Code2, Megaphone, Building2, Check } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = getMetadata({
  title: "Partner Program",
  description:
    "Join the Go2 Partner Program. Earn commissions, get early access, and grow together.",
});

const partnerTypes = [
  {
    icon: Megaphone,
    title: "Affiliate Partners",
    description: "Earn 20% recurring commission for every customer you refer to Go2.",
    benefits: [
      "20% recurring commission",
      "90-day cookie window",
      "Custom tracking links",
      "Monthly payouts",
    ],
    cta: "Join Affiliate Program",
    href: "/register?partner=affiliate",
  },
  {
    icon: Code2,
    title: "Integration Partners",
    description: "Build integrations with Go2 and get featured in our marketplace.",
    benefits: [
      "Featured in our integrations page",
      "Early API access",
      "Co-marketing opportunities",
      "Technical support",
    ],
    cta: "Apply for Integration",
    href: `mailto:${siteConfig.email}?subject=Integration Partner Application`,
  },
  {
    icon: Building2,
    title: "Agency Partners",
    description: "White-label Go2 for your clients with special agency pricing.",
    benefits: [
      "White-label options",
      "Volume discounts",
      "Dedicated account manager",
      "Priority support",
    ],
    cta: "Become an Agency Partner",
    href: `mailto:${siteConfig.email}?subject=Agency Partner Application`,
  },
];

const integrationPartners = [
  { name: "Zapier", category: "Automation" },
  { name: "Make", category: "Automation" },
  { name: "Slack", category: "Communication" },
  { name: "GitHub", category: "Development" },
];

const stats = [
  { value: "20%", label: "Recurring Commission" },
  { value: "90", label: "Day Cookie Window" },
  { value: "$5K+", label: "Avg Partner Earnings/mo" },
  { value: "500+", label: "Active Partners" },
];

export default function PartnersPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Handshake className="h-4 w-4" />
            Partner Program
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Grow <span className="text-[var(--marketing-accent)] text-gradient-warm">together</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Join our partner program and earn recurring commissions while helping your audience
            discover the fastest link shortener on the planet.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[var(--marketing-accent)] md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[var(--marketing-text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-[var(--marketing-text)] text-center mb-12">
            Partner Programs
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {partnerTypes.map((type) => (
              <div
                key={type.title}
                className="flex flex-col p-8 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mb-6">
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-[var(--marketing-text-muted)] mb-6">
                  {type.description}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {type.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-[var(--marketing-accent)] flex-shrink-0" />
                      <span className="text-[var(--marketing-text)]">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link href={type.href}>
                  <Button className="w-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                    {type.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[var(--marketing-text)] mb-4">
              Integration Partners
            </h2>
            <p className="text-[var(--marketing-text-muted)] mb-12">
              We work with leading platforms to provide seamless integrations.
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {integrationPartners.map((partner) => (
                <div
                  key={partner.name}
                  className="p-6 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
                >
                  <div className="text-lg font-bold text-[var(--marketing-text)] mb-1">
                    {partner.name}
                  </div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">
                    {partner.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-[var(--marketing-text)] text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--marketing-text)] mb-2">Sign Up</h3>
                <p className="text-[var(--marketing-text-muted)]">
                  Apply to join our partner program. We'll review your application within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--marketing-text)] mb-2">
                  Share Your Link
                </h3>
                <p className="text-[var(--marketing-text-muted)]">
                  Get your unique referral link and start sharing with your audience.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--marketing-text)] mb-2">
                  Earn Commissions
                </h3>
                <p className="text-[var(--marketing-text-muted)]">
                  Earn 20% recurring commission for every paying customer you refer. Payouts are
                  monthly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-4">
              Ready to Partner?
            </h2>
            <p className="text-[var(--marketing-text-muted)] mb-6">
              Join hundreds of partners earning recurring revenue with Go2.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register?partner=affiliate">
                <Button className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                  Join Affiliate Program
                </Button>
              </Link>
              <a href={`mailto:${siteConfig.email}?subject=Partner Inquiry`}>
                <Button
                  variant="outline"
                  className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
                >
                  Contact Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

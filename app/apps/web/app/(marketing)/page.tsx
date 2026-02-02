import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, siteConfig } from "@repo/config";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap, TrendingUp, Github } from "lucide-react";
import { LinkShortenerDemo } from "@/components/marketing/link-shortener-demo";
import { SpeedComparison } from "@/components/marketing/speed-comparison";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
// import { LogoCloud } from "@/components/marketing/sections/logo-cloud"; // Disabled for now
import { ProductShowcase } from "@/components/marketing/sections/product-showcase";
import { FeatureShowcase } from "@/components/marketing/sections/feature-showcase";
import { CTA } from "@/components/marketing/sections/cta";
import { WhyGo2 } from "@/components/marketing/sections/why-go2";
import { BrandStory } from "@/components/marketing/sections/brand-story";
import { UseCases } from "@/components/marketing/sections/use-cases";
import { TrustBadges } from "@/components/marketing/sections/trust-badges";

export const metadata: Metadata = getMetadata({
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
});

export default function HomePage() {
  return (
    <>
      {/* Hero Section - Premium Redesign (Light/Modern) */}
      <section className="relative overflow-hidden pt-20 md:pt-32 lg:pt-40 pb-20 md:pb-32 bg-[var(--marketing-bg)]">
        <GeometricShapes position="hero-right" />

        <div className="max-w-7xl relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
                <Zap className="h-4 w-4" />
                <span>Developer-First Link Management</span>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-6xl md:text-7xl animate-fade-in-up leading-[1.1]">
                Short Links,
                <span className="block mt-2 text-gradient-warm">
                  that load in a blink.
                </span>
              </h1>

              <p className="mt-8 text-xl text-[var(--marketing-text-muted)] leading-relaxed animate-fade-in-up stagger-1 max-w-lg">
                The developer-first link platform. Built on{" "}
                <span className="font-semibold text-[var(--marketing-text)]">
                  Cloudflare's edge network
                </span>{" "}
                for sub-10ms redirects, real-time analytics, and programmatic
                control.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up stagger-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="rounded-full h-14 px-8 text-lg font-bold bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] shadow-lg shadow-[var(--marketing-accent)]/20 hover-lift"
                  >
                    Start free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-14 px-8 text-lg font-bold border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent hover-lift"
                  >
                    Book a demo
                  </Button>
                </Link>
              </div>

              {/* Trust Markers */}
              <div className="mt-12 flex flex-wrap items-center gap-6 sm:gap-8 animate-fade-in-up stagger-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--marketing-text-muted)]">
                  <Check className="h-4 w-4 text-[var(--marketing-accent)]" />
                  <span>14-day Pro trial</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--marketing-text-muted)]">
                  <Github className="h-4 w-4 text-[var(--marketing-accent)]" />
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--marketing-text-muted)]">
                  <Check className="h-4 w-4 text-[var(--marketing-accent)]" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Right Content - Demo */}
            <div className="relative animate-fade-in-up stagger-2 mt-8 lg:mt-0">
              <div className="relative rounded-2xl lg:rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 shadow-2xl shadow-[var(--marketing-accent)]/5 hover-lift z-10">
                <LinkShortenerDemo />
              </div>

              {/* Floating stats card decoration - Hidden on mobile */}
              <div className="hidden lg:block absolute -top-6 -right-6 p-6 rounded-2xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] shadow-xl animate-float z-0 opacity-80 scale-90 blur-[1px]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--marketing-accent)]/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[var(--marketing-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--marketing-text-muted)]">
                      Click Rate
                    </p>
                    <p className="text-2xl font-bold text-[var(--marketing-text)]">
                      +124%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Immediate credibility */}
      <TrustBadges />

      {/* Brand Story - Emotional connection: "Why we exist" */}
      <BrandStory />

      {/* Product Showcase - Analytics deep dive */}
      <ProductShowcase />

      {/* Feature Showcase - Core features */}
      <FeatureShowcase />

      {/* Use Cases - Relatability: "Is this for me?" */}
      <UseCases />

      {/* Speed Comparison - Technical proof for developers/skeptics */}
      <section className="relative overflow-hidden border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl md:text-5xl">
              Engineered for{" "}
              <span className="text-gradient-warm">extreme speed</span>
            </h2>
            <p className="mt-6 text-lg text-[var(--marketing-text-muted)] max-w-2xl mx-auto">
              Powered by Cloudflare Workers. Your links resolve in milliseconds,
              delivering a better experience for users worldwide.
            </p>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <SpeedComparison />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTA />
    </>
  );
}

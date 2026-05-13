import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Palette,
  BarChart3,
  Globe,
  Smartphone,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "Link in Bio - Your Personal Link Page",
  description:
    "Create a beautiful bio link page to share all your important links. Customizable themes, analytics, and custom domains.",
});

const features = [
  {
    icon: Palette,
    title: "Beautiful Themes",
    description: "Choose from stunning themes or create your own with custom colors and fonts.",
  },
  {
    icon: BarChart3,
    title: "Click Analytics",
    description: "See which links get the most clicks and optimize your bio page.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Use your own domain like yourname.com instead of go2.gg/@username.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Looks perfect on any device. Your bio page is always responsive.",
  },
  {
    icon: Sparkles,
    title: "Rich Media",
    description: "Embed YouTube videos, Spotify playlists, and more directly in your bio.",
  },
];

const themes = [
  { name: "Default", colors: ["#FFFFFF", "#000000", "#6366F1"] },
  { name: "Gradient", colors: ["#EC4899", "#8B5CF6", "#FFFFFF"] },
  { name: "Dark", colors: ["#1F2937", "#F3F4F6", "#10B981"] },
  { name: "Neon", colors: ["#000000", "#22C55E", "#22C55E"] },
  { name: "Pastel", colors: ["#FDF2F8", "#374151", "#F472B6"] },
  { name: "Minimal", colors: ["#F9FAFB", "#111827", "#6B7280"] },
];

export default function LinkInBioPage() {
  return (
    <div className="bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="max-w-7xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-2 font-medium text-[var(--marketing-accent)] text-sm">
            <Link2 className="h-4 w-4" />
            Link in Bio
          </div>
          <h1 className="font-bold text-4xl text-[var(--marketing-text)] tracking-tight md:text-6xl">
            One Link for
            <span className="mt-2 block text-gradient">Everything You Share</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[var(--marketing-text-muted)] text-lg">
            Create a beautiful bio link page in minutes. Share all your important links, social
            profiles, and content in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
              >
                Create Your Bio Page
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/bio/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
              >
                See Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Theme Preview */}
      <section className="overflow-hidden border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="font-bold text-[var(--marketing-text)] text-xl">Choose Your Style</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {themes.map((theme) => (
              <div
                key={theme.name}
                className="cursor-pointer rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 transition-colors hover:border-[var(--marketing-accent)]/30"
              >
                <div
                  className="flex h-32 w-24 flex-col items-center justify-center gap-2 rounded-lg p-2"
                  style={{ backgroundColor: theme.colors[0] }}
                >
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: theme.colors[2] }}
                  />
                  <div className="h-2 w-16 rounded" style={{ backgroundColor: theme.colors[1] }} />
                  <div
                    className="h-6 w-16 rounded"
                    style={{ backgroundColor: theme.colors[2], opacity: 0.2 }}
                  />
                  <div
                    className="h-6 w-16 rounded"
                    style={{ backgroundColor: theme.colors[2], opacity: 0.2 }}
                  />
                </div>
                <p className="mt-2 text-center font-medium text-[var(--marketing-text)] text-xs">
                  {theme.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl bg-[var(--marketing-bg)] px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-bold text-2xl text-[var(--marketing-text)] md:text-4xl">
            Everything You Need in One Place
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--marketing-text)] text-lg">
                {feature.title}
              </h3>
              <p className="mt-2 text-[var(--marketing-text-muted)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)]">
              Why Choose Go2 Link in Bio?
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
                <h3 className="mb-4 font-semibold text-[var(--marketing-text)]">Go2 Bio</h3>
                <ul className="space-y-3">
                  {[
                    "Free forever plan",
                    "Custom domains included",
                    "Detailed analytics",
                    "No Go2 branding on paid plans",
                    "Unlimited links",
                    "Theme customization",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-[var(--marketing-text)] text-sm"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-6">
                <h3 className="mb-4 font-semibold text-[var(--marketing-text-muted)]">Others</h3>
                <ul className="space-y-3 text-[var(--marketing-text-muted)]">
                  {[
                    "Limited free plans",
                    "Custom domains cost extra",
                    "Basic analytics only",
                    "Branding on all plans",
                    "Link limits",
                    "Limited customization",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <span className="h-4 w-4 text-center">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
}

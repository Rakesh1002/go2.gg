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
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-2 text-sm font-medium text-[var(--marketing-accent)] mb-6">
            <Link2 className="h-4 w-4" />
            Link in Bio
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl text-[var(--marketing-text)]">
            One Link for
            <span className="text-gradient block mt-2">Everything You Share</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--marketing-text-muted)]">
            Create a beautiful bio link page in minutes. Share all your important links, social
            profiles, and content in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
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
                className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                See Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Theme Preview */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30 overflow-hidden">
        <div className="max-w-7xl px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[var(--marketing-text)]">Choose Your Style</h2>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            {themes.map((theme) => (
              <div
                key={theme.name}
                className="rounded-xl border border-[var(--marketing-border)] p-4 bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-accent)]/30 transition-colors cursor-pointer"
              >
                <div
                  className="w-24 h-32 rounded-lg flex flex-col items-center justify-center gap-2 p-2"
                  style={{ backgroundColor: theme.colors[0] }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: theme.colors[2] }}
                  />
                  <div className="w-16 h-2 rounded" style={{ backgroundColor: theme.colors[1] }} />
                  <div
                    className="w-16 h-6 rounded"
                    style={{ backgroundColor: theme.colors[2], opacity: 0.2 }}
                  />
                  <div
                    className="w-16 h-6 rounded"
                    style={{ backgroundColor: theme.colors[2], opacity: 0.2 }}
                  />
                </div>
                <p className="text-xs text-center mt-2 font-medium text-[var(--marketing-text)]">
                  {theme.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
            Everything You Need in One Place
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-[var(--marketing-text)]">
                {feature.title}
              </h3>
              <p className="text-[var(--marketing-text-muted)] mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-[var(--marketing-text)]">
              Why Choose Go2 Link in Bio?
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
                <h3 className="font-semibold mb-4 text-[var(--marketing-text)]">Go2 Bio</h3>
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
                      className="flex items-center gap-2 text-sm text-[var(--marketing-text)]"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-6">
                <h3 className="font-semibold mb-4 text-[var(--marketing-text-muted)]">Others</h3>
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

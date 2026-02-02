import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { CTA } from "@/components/marketing/sections";
import { Sparkles } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "About",
  description: "Learn about Go2, the edge-native URL shortener built for speed and scale.",
});

const values = [
  {
    title: "Speed First",
    description:
      "Every millisecond matters. We obsess over performance to deliver the fastest redirects possible.",
  },
  {
    title: "Developer Friendly",
    description:
      "Clean APIs, comprehensive docs, and webhooks. We build for developers who build for others.",
  },
  {
    title: "Privacy Focused",
    description:
      "No invasive tracking. We collect only what's needed for analytics, with GDPR compliance built-in.",
  },
  {
    title: "Infinitely Scalable",
    description:
      "Built on Cloudflare's global network. From 100 clicks to 100 million — no infrastructure to manage.",
  },
];

const stats = [
  { value: "<10ms", label: "Average redirect time" },
  { value: "310+", label: "Edge locations worldwide" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "0", label: "Cold starts" },
];

export default function AboutPage() {
  return (
    <>
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-[var(--marketing-bg)] pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />

        <div className="max-w-7xl mx-auto relative px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Sparkles className="h-4 w-4" />
            Our Mission
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            Building the internet's <span className="text-gradient-warm">fastest</span> layer.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            We're on a mission to eliminate redirect latency. By leveraging the power of edge
            computing, we ensure your links load instantly, anywhere on Earth.
          </p>
        </div>
      </section>

      {/* Modern Stats Grid */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="group flex flex-col items-center">
                <div className="text-4xl font-bold tracking-tight text-[var(--marketing-text)] md:text-5xl group-hover:text-[var(--marketing-accent)] transition-colors ">
                  {stat.value}
                </div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-widest text-[var(--marketing-text-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 md:py-32 bg-[var(--marketing-bg)]">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl md:text-5xl mb-8 text-center md:text-left ">
            Why we exist.
          </h2>
          <div className="text-lg leading-relaxed text-[var(--marketing-text-muted)] space-y-6">
            <p>
              For decades, link shorteners have stayed the same. They rely on aging, centralized
              databases that introduce hop after hop between a click and the destination. In a world
              where milliseconds determine conversion, this wasn't good enough.
            </p>
            <div className="rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 p-8 my-10 italic border-l-4 border-l-[var(--marketing-accent)]">
              <p className="m-0 text-[var(--marketing-text)] font-medium  text-xl">
                "We didn't just want to build another URL shortener. We wanted to build a global
                redirect network that feels invisible."
              </p>
            </div>
            <p>
              Go2 was born from a simple question: What if redirects lived at the edge? What if we
              could serve links from a city 10 miles away instead of a data center 3,000 miles away?
            </p>
            <p>
              Today, Go2 is powered by Cloudflare's massive edge network, ensuring that whether your
              audience is in Tokyo, Berlin, or San Francisco, your links are served with sub-50ms
              latency. No server cold starts. No database bottleneck. Just speed.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative overflow-hidden border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl ">
              Principles over profit.
            </h2>
            <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">
              We guide every decision by these four core values.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-5xl mx-auto">
            {values.map((value, idx) => (
              <div
                key={value.title}
                className="group relative rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-10 transition-all hover:border-[var(--marketing-accent)]/30 hover:-translate-y-1"
              >
                <div className="absolute top-8 right-8 text-6xl font-black text-[var(--marketing-text)]/5 select-none ">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-4 group-hover:text-[var(--marketing-accent)] transition-colors">
                  {value.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)] leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Infrastructure */}
      <section className="max-w-7xl mx-auto px-4 py-24 md:py-32 bg-[var(--marketing-bg)]">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl ">
            Elite Tech. Zero Complexity.
          </h2>
          <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">
            Our stack is designed for extreme durability and performance.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              tag: "Compute",
              name: "Cloudflare Workers",
              desc: "No central servers. Redirection logic lives in 310+ cities.",
            },
            {
              tag: "Storage",
              name: "Global KV Store",
              desc: "Link data is replicated worldwide for instant lookups.",
            },
            {
              tag: "Database",
              name: "Cloudflare D1",
              desc: "Highly available SQLite built for the modern web.",
            },
            {
              tag: "Insight",
              name: "Modern Analytics",
              desc: "Real-time tracking without compromising user privacy.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-3 p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-accent)]/30 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--marketing-accent)] px-2 py-1 rounded bg-[var(--marketing-accent)]/10 w-fit">
                {item.tag}
              </span>
              <h4 className="font-bold text-lg text-[var(--marketing-text)]">{item.name}</h4>
              <p className="text-sm text-[var(--marketing-text-muted)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CTA
        headline="Join the fast lane."
        description="Experience the speed that thousands of teams already rely on."
        primaryCTA={{ text: "Start free", href: "/register" }}
        secondaryCTA={{ text: "View the platform", href: "/features" }}
      />
    </>
  );
}

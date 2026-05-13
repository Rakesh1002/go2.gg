import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { CTA } from "@/components/marketing/sections";
import { Sparkles } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "About",
  description:
    "Go2 is the branded short-link platform built for your team — and your AI. Custom domains, full analytics, and a first-class MCP server so every link your team or your agent ships lives in one workspace. Edge-native on Cloudflare. Open source.",
});

const values = [
  {
    title: "Your domain. Your data. Your dashboard.",
    description:
      "Whether you, your team, or your AI created the link, it lives in your workspace, on your domain. Every click rolls back to the actor that produced it — without giving up ownership of the data.",
  },
  {
    title: "Open standards, not walled gardens",
    description:
      "MCP server, OpenAPI 3.1, OAuth 2.1, AGENTS.md, llms.txt — open building blocks any backend or agent runtime can use. We'd rather be one tool in your stack than the only tool.",
  },
  {
    title: "Edge by default",
    description:
      "Sub-10ms redirects from 330+ Cloudflare locations. Zero cold starts. Fast for human visitors, fast for agent tool calls, fast everywhere.",
  },
  {
    title: "Open source, owner-controlled",
    description:
      "AGPL on the whole stack. Self-host with a single wrangler deploy if you'd rather. Your data, your runtime, your call.",
  },
];

const stats = [
  { value: "<10ms", label: "Average redirect time" },
  { value: "330+", label: "Edge locations worldwide" },
  { value: "99.9%", label: "Uptime SLA on Business+" },
  { value: "0", label: "Cold starts" },
];

export default function AboutPage() {
  return (
    <>
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-[var(--marketing-bg)] pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Sparkles className="h-4 w-4" />
            Our Mission
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Short links for your team —{" "}
            <span className="text-gradient-warm">and your AI.</span>
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            We started Go2 because the next decade of links won't be created the way the last
            decade was. Some will come from a person clicking "shorten." Others will come from
            an AI agent acting on someone's behalf. They should land in the same workspace, on
            the same domain, with the same analytics — with a clean line between who acted and
            who owns.
          </p>
        </div>
      </section>

      {/* Modern Stats Grid */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:py-20">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="group flex flex-col items-center">
                <div className="font-bold text-4xl text-[var(--marketing-text)] tracking-tight transition-colors group-hover:text-[var(--marketing-accent)] md:text-5xl ">
                  {stat.value}
                </div>
                <div className="mt-3 font-semibold text-[var(--marketing-text-muted)] text-sm uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="mx-auto max-w-7xl bg-[var(--marketing-bg)] px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-left md:text-5xl ">
            Why we exist.
          </h2>
          <div className="space-y-6 text-[var(--marketing-text-muted)] text-lg leading-relaxed">
            <p>
              We started Go2 because the link platform we needed didn't exist. Agents are starting to
              create most of the links in our lives — for the businesses, brands, and creators they
              work for. But every shortener on the market still treats the link as a marketing asset
              minted by a human, not a primitive minted by an actor on someone else's behalf.
            </p>
            <div className="my-10 rounded-2xl border border-[var(--marketing-accent)]/20 border-l-4 border-l-[var(--marketing-accent)] bg-[var(--marketing-accent)]/5 p-8 italic">
              <p className="m-0 font-medium text-[var(--marketing-text)] text-xl">
                "An agent works for you. The links it ships should too — your domain, your data, your
                dashboard, your right to revoke."
              </p>
            </div>
            <p>
              So we built two products on one platform. For the agent: an MCP server, an A2A card,
              OAuth 2.1 with dynamic client registration, per-run attribution, and lifecycle controls
              you set with a single parameter. For the human owner: a workspace, custom domains, QR,
              link-in-bio, A/B tests, conversions, retargeting pixels, webhooks, audit logs — every
              link agents create rolls into your account, scoped to your organization, governed by you.
            </p>
            <p>
              Go2 lives on Cloudflare's edge network so the redirect itself is sub-10ms from anywhere,
              the click ledger is fast enough to query from a tool call, and the whole stack stands
              up from a single <code>wrangler deploy</code> if you'd rather self-host. Open source.
              AGPL. The agentic economy needs primitives, not platforms — so we built the primitives
              and gave them away.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative overflow-hidden border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl ">
              The four lines we don't cross.
            </h2>
            <p className="mt-4 text-[var(--marketing-text-muted)] text-lg">
              The principles every product decision has to clear.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
            {values.map((value, idx) => (
              <div
                key={value.title}
                className="group hover:-translate-y-1 relative rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-10 transition-all hover:border-[var(--marketing-accent)]/30"
              >
                <div className="absolute top-8 right-8 select-none font-black text-6xl text-[var(--marketing-text)]/5 ">
                  0{idx + 1}
                </div>
                <h3 className="mb-4 font-bold text-[var(--marketing-text)] text-xl transition-colors group-hover:text-[var(--marketing-accent)]">
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
      <section className="mx-auto max-w-7xl bg-[var(--marketing-bg)] px-4 py-24 md:py-32">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl ">
            Elite Tech. Zero Complexity.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-lg">
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
              className="flex flex-col gap-3 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/30"
            >
              <span className="w-fit rounded bg-[var(--marketing-accent)]/10 px-2 py-1 font-bold text-[10px] text-[var(--marketing-accent)] uppercase tracking-widest">
                {item.tag}
              </span>
              <h4 className="font-bold text-[var(--marketing-text)] text-lg">{item.name}</h4>
              <p className="text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CTA
        headline="Two products, one platform."
        description="Wire your agent up in five minutes, or sign up and watch the links your agent ships land in your dashboard."
        primaryCTA={{ text: "Start free", href: "/register" }}
        secondaryCTA={{ text: "Read the agent quickstart", href: "/agents/quickstart" }}
      />
    </>
  );
}

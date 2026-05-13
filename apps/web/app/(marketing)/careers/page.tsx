import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, siteConfig } from "@repo/config";
import {
  Briefcase,
  MapPin,
  Clock,
  Heart,
  Globe,
  Zap,
  Users,
  Coffee,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = getMetadata({
  title: "Careers - Join Our Team",
  description:
    "Join the Go2 team. We're building the fastest link shortener on the planet and we're looking for talented people.",
});

const values = [
  {
    icon: Zap,
    title: "Speed Obsessed",
    description: "We care deeply about performance. Every millisecond matters.",
  },
  {
    icon: Heart,
    title: "User First",
    description: "We build products that we'd want to use ourselves.",
  },
  {
    icon: Globe,
    title: "Remote Native",
    description: "Work from anywhere. We're a distributed team across time zones.",
  },
  {
    icon: Sparkles,
    title: "Ship Fast",
    description: "We believe in rapid iteration and continuous improvement.",
  },
];

const benefits = [
  { icon: Globe, title: "Remote-First", description: "Work from anywhere in the world" },
  { icon: Clock, title: "Flexible Hours", description: "Work when you're most productive" },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health coverage" },
  { icon: Coffee, title: "Home Office", description: "$1,000 setup stipend" },
  { icon: Users, title: "Team Retreats", description: "Annual company gatherings" },
  { icon: Zap, title: "Latest Tech", description: "Top-of-the-line equipment" },
];

const openPositions: Array<{
  title: string;
  department: string;
  location: string;
  type: string;
  href: string;
}> = [
  // Add positions here when available
  // {
  //   title: "Senior Software Engineer",
  //   department: "Engineering",
  //   location: "Remote",
  //   type: "Full-time",
  //   href: "#",
  // },
];

export default function CareersPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            <Briefcase className="h-4 w-4" />
            We're Hiring
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Build the{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">future</span> of
            links
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            We're a small, remote team building the fastest link shortener on the planet. Join us
            and help shape how billions of links are shared.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-[var(--marketing-text)]">
            Our Values
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-lg">
                  {value.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)] text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center font-bold text-3xl text-[var(--marketing-text)]">
              Benefits & Perks
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--marketing-text)]">{benefit.title}</h3>
                    <p className="text-[var(--marketing-text-muted)] text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-[var(--marketing-text)]">
            Open Positions
          </h2>

          {openPositions.length > 0 ? (
            <div className="space-y-4">
              {openPositions.map((position, idx) => (
                <Link
                  key={idx}
                  href={position.href}
                  className="group flex items-center justify-between rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/30"
                >
                  <div>
                    <h3 className="font-bold text-[var(--marketing-text)] text-lg transition-colors group-hover:text-[var(--marketing-accent)]">
                      {position.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-[var(--marketing-text-muted)] text-sm">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[var(--marketing-text-muted)] transition-all group-hover:translate-x-1 group-hover:text-[var(--marketing-accent)]" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-12 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-[var(--marketing-text-muted)]" />
              <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                No Open Positions
              </h3>
              <p className="mx-auto mb-6 max-w-md text-[var(--marketing-text-muted)]">
                We don't have any open positions right now, but we're always interested in hearing
                from talented people.
              </p>
              <a
                href={`mailto:${siteConfig.email}?subject=Career Inquiry`}
                className="font-medium text-[var(--marketing-accent)] hover:underline"
              >
                Send us your resume →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-bold text-2xl text-[var(--marketing-text)]">
              Don't see the right role?
            </h2>
            <p className="mb-6 text-[var(--marketing-text-muted)]">
              We're always looking for exceptional people. Reach out and tell us about yourself.
            </p>
            <a href={`mailto:${siteConfig.email}?subject=Career Inquiry`}>
              <Button className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                Get in Touch
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

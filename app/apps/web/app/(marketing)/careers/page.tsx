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
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Briefcase className="h-4 w-4" />
            We're Hiring
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Build the{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">future</span> of
            links
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            We're a small, remote team building the fastest link shortener on the planet. Join us
            and help shape how billions of links are shared.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-[var(--marketing-text)] text-center mb-12">
            Our Values
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mx-auto mb-4">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-lg text-[var(--marketing-text)] mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-[var(--marketing-text-muted)]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-[var(--marketing-text)] text-center mb-12">
              Benefits & Perks
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] flex-shrink-0">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--marketing-text)]">{benefit.title}</h3>
                    <p className="text-sm text-[var(--marketing-text-muted)]">
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
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-[var(--marketing-text)] text-center mb-12">
            Open Positions
          </h2>

          {openPositions.length > 0 ? (
            <div className="space-y-4">
              {openPositions.map((position, idx) => (
                <Link
                  key={idx}
                  href={position.href}
                  className="group flex items-center justify-between p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-accent)]/30 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-lg text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors">
                      {position.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[var(--marketing-text-muted)]">
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
                  <ArrowRight className="h-5 w-5 text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-accent)] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
              <Briefcase className="h-12 w-12 text-[var(--marketing-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                No Open Positions
              </h3>
              <p className="text-[var(--marketing-text-muted)] mb-6 max-w-md mx-auto">
                We don't have any open positions right now, but we're always interested in hearing
                from talented people.
              </p>
              <a
                href={`mailto:${siteConfig.email}?subject=Career Inquiry`}
                className="text-[var(--marketing-accent)] hover:underline font-medium"
              >
                Send us your resume →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-4">
              Don't see the right role?
            </h2>
            <p className="text-[var(--marketing-text-muted)] mb-6">
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

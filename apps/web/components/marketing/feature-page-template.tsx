import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, ArrowRight, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CTA } from "./sections";
import { GeometricShapes } from "./decorative/geometric-shapes";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface AgentCallout {
  title?: string;
  body: string;
  primitive?: string;
}

interface FeaturePageProps {
  badge?: string;
  title: string;
  subtitle: string;
  features: Feature[];
  benefits: string[];
  demo?: ReactNode;
  faqs?: FAQ[];
  ctaTitle?: string;
  ctaDescription?: string;
  agentCallout?: AgentCallout;
  // Optional section slots
  metricsHighlight?: ReactNode;
  comparisonWidget?: ReactNode;
  howItWorks?: ReactNode;
  integrations?: ReactNode;
  migrationCta?: ReactNode;
}

export function FeaturePageTemplate({
  badge,
  title,
  subtitle,
  features,
  benefits,
  demo,
  faqs,
  ctaTitle,
  ctaDescription,
  agentCallout,
  metricsHighlight,
  comparisonWidget,
  howItWorks,
  integrations,
  migrationCta,
}: FeaturePageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--marketing-bg)] pt-20 pb-20 md:pt-32 md:pb-32 lg:pt-40">
        <GeometricShapes position="hero-right" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          {badge && (
            <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
              {badge}
            </div>
          )}
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            {subtitle}
          </p>
          <div className="stagger-2 mt-10 flex animate-fade-in-up flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="hover-lift h-14 rounded-full bg-[var(--marketing-accent)] px-8 font-bold text-lg text-white shadow-[var(--marketing-accent)]/20 shadow-lg hover:bg-[var(--marketing-accent-light)]"
              >
                Start free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                variant="outline"
                size="lg"
                className="hover-lift h-14 rounded-full border-[var(--marketing-border)] bg-transparent px-8 font-bold text-[var(--marketing-text)] text-lg hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
              >
                View docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Highlight - After Hero */}
      {metricsHighlight}

      {/* Demo */}
      {demo && (
        <section className="relative border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/50 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 shadow-2xl shadow-[var(--marketing-accent)]/5">
              {demo}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Widget - After Demo */}
      {comparisonWidget}

      {/* Agent callout — how this feature behaves when an agent is the creator */}
      {agentCallout && (
        <section className="relative bg-[var(--marketing-bg)] py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/[0.03] p-8 md:p-10">
              <div className="flex items-start gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10">
                  <Bot className="h-5 w-5 text-[var(--marketing-accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 font-bold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
                    When your agent uses this
                  </p>
                  <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl md:text-2xl">
                    {agentCallout.title ?? "Agents inherit it. You stay the owner."}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)] leading-relaxed">
                    {agentCallout.body}
                  </p>
                  {agentCallout.primitive && (
                    <p className="mt-4 break-words font-mono text-[12px] text-[var(--marketing-text-muted)]">
                      {agentCallout.primitive}
                    </p>
                  )}
                  <Link
                    href="/agents"
                    className="mt-5 inline-flex items-center gap-1 font-semibold text-[var(--marketing-accent)] text-sm hover:text-[var(--marketing-accent-light)]"
                  >
                    See the full agent platform
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="relative bg-[var(--marketing-bg)] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-5xl">
              Key Features
            </h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group hover:-translate-y-1 relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-[var(--marketing-accent)]/5 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations - After Features */}
      {integrations}

      {/* How It Works - Before Benefits */}
      {howItWorks}

      {/* Benefits */}
      <section className="relative border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-16 text-center font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-5xl">
              Why Choose Go2?
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-4 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-[var(--marketing-accent)]/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                    <Check className="h-5 w-5 text-[var(--marketing-accent)]" />
                  </div>
                  <span className="font-medium text-[var(--marketing-text)] text-lg">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {faqs && faqs.length > 0 && (
        <section className="relative bg-[var(--marketing-bg)] py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-12 text-center font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border-[var(--marketing-border)]"
                >
                  <AccordionTrigger className="text-left font-medium text-[var(--marketing-text)] text-lg hover:text-[var(--marketing-accent)]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[var(--marketing-text-muted)] text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Migration CTA - Before Final CTA */}
      {migrationCta}

      {/* CTA */}
      <CTA headline={ctaTitle} description={ctaDescription} />
    </>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, ArrowRight } from "lucide-react";
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
  metricsHighlight,
  comparisonWidget,
  howItWorks,
  integrations,
  migrationCta,
}: FeaturePageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 md:pt-32 lg:pt-40 pb-20 md:pb-32 bg-[var(--marketing-bg)]">
        <GeometricShapes position="hero-right" />

        <div className="max-w-7xl relative mx-auto px-4 text-center">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
              {badge}
            </div>
          )}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            {title}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up stagger-2">
            <Link href="/register">
              <Button
                size="lg"
                className="rounded-full h-14 px-8 text-lg font-bold bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] shadow-lg shadow-[var(--marketing-accent)]/20 hover-lift"
              >
                Start free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-14 px-8 text-lg font-bold border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent hover-lift"
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
        <section className="relative border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 shadow-2xl shadow-[var(--marketing-accent)]/5">
              {demo}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Widget - After Demo */}
      {comparisonWidget}

      {/* Features Grid */}
      <section className="relative py-24 md:py-32 bg-[var(--marketing-bg)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl md:text-5xl">
              Key Features
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--marketing-accent)]/5"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] group-hover:bg-[var(--marketing-accent)] group-hover:text-white transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-3">
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
      <section className="relative py-24 md:py-32 border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl md:text-5xl mb-16">
              Why Choose Go2?
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-4 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                    <Check className="h-5 w-5 text-[var(--marketing-accent)]" />
                  </div>
                  <span className="text-lg font-medium text-[var(--marketing-text)]">
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
        <section className="relative py-24 md:py-32 bg-[var(--marketing-bg)]">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--marketing-text)] sm:text-4xl mb-12">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border-[var(--marketing-border)]"
                >
                  <AccordionTrigger className="text-lg font-medium text-[var(--marketing-text)] hover:text-[var(--marketing-accent)] text-left">
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

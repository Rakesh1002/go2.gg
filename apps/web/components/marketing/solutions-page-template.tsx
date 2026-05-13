import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

interface UseCase {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface FAQ {
  question: string;
  answer: string;
}

interface SolutionsPageProps {
  badge?: string;
  title: string;
  subtitle: string;
  useCases: UseCase[];
  benefits: string[];
  ctaTitle?: string;
  ctaDescription?: string;
  heroImage?: ReactNode;
  // Optional section slots
  stats?: ReactNode;
  socialProof?: ReactNode;
  howItWorks?: ReactNode;
  integrations?: ReactNode;
  faqs?: FAQ[];
}

export function SolutionsPageTemplate({
  badge,
  title,
  subtitle,
  useCases,
  benefits,
  ctaTitle,
  ctaDescription,
  heroImage,
  stats,
  socialProof,
  // biome-ignore lint/correctness/noUnusedVariables: kept on the public API; consumed by other variants of the template
  howItWorks,
  // biome-ignore lint/correctness/noUnusedVariables: kept on the public API; consumed by other variants of the template
  integrations,
  faqs,
}: SolutionsPageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--marketing-bg)] pt-20 pb-20 md:pt-32 md:pb-32 lg:pt-40">
        <GeometricShapes position="hero-right" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              {badge && (
                <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
                  {badge}
                </div>
              )}
              <h1 className="animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] leading-tight tracking-tight sm:text-5xl md:text-6xl">
                {title}
              </h1>
              <p className="stagger-1 mt-8 animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
                {subtitle}
              </p>
              <div className="stagger-2 mt-10 flex animate-fade-in-up flex-wrap gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="hover-lift h-14 rounded-full bg-[var(--marketing-accent)] px-8 font-bold text-lg text-white shadow-[var(--marketing-accent)]/20 shadow-lg hover:bg-[var(--marketing-accent-light)]"
                  >
                    Start free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="hover-lift h-14 rounded-full border-[var(--marketing-border)] bg-transparent px-8 font-bold text-[var(--marketing-text)] text-lg hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
                  >
                    Book a demo
                  </Button>
                </Link>
              </div>
            </div>

            {heroImage && (
              <div className="stagger-2 relative hidden animate-fade-in-up lg:block">
                <div className="relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 shadow-2xl shadow-[var(--marketing-accent)]/5">
                  {heroImage}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats - After Hero */}
      {stats}

      {/* Social Proof / Logo Cloud - After Stats */}
      {socialProof}

      {/* Use Cases */}
      <section className="relative bg-[var(--marketing-bg)] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-5xl">
              Built for your workflow
            </h2>
          </div>
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {useCases.map((useCase) => {
              const IconComponent = useCase.icon;
              return (
                <div
                  key={useCase.title}
                  className="group hover:-translate-y-1 relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-[var(--marketing-accent)]/5 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-white">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-bold text-[var(--marketing-text)] text-xl">
                    {useCase.title}
                  </h3>
                  <p className="text-[var(--marketing-text-muted)] leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits List */}
      <section className="relative border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-16 text-center font-bold text-3xl text-[var(--marketing-text)] tracking-tight sm:text-4xl md:text-5xl">
              Everything you need to scale
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
            <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
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

      {/* CTA */}
      <CTA headline={ctaTitle} description={ctaDescription} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smartphone, BarChart3, Zap, Shield, ArrowRight, Check } from "lucide-react";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "SMS Link Optimization - Short Links for Text Messages",
  description:
    "Create SMS-optimized short links with character counting, carrier-safe domains, and click tracking. Perfect for text marketing campaigns.",
});

const features = [
  {
    icon: MessageSquare,
    title: "SMS Character Counting",
    description:
      "See exactly how many SMS segments your message will use with real-time character counting.",
  },
  {
    icon: Smartphone,
    title: "Carrier-Safe Domains",
    description: "Our domains are optimized for SMS delivery and won't trigger spam filters.",
  },
  {
    icon: Zap,
    title: "Ultra-Short Slugs",
    description:
      "Generate 4-character slugs automatically for SMS-optimized links that save space.",
  },
  {
    icon: BarChart3,
    title: "SMS Click Tracking",
    description: "Track clicks from SMS campaigns separately with detailed analytics.",
  },
  {
    icon: Shield,
    title: "Message Preview",
    description: "Preview how your link will appear in SMS before sending.",
  },
  {
    icon: MessageSquare,
    title: "Template Library",
    description: "Use pre-built SMS message templates for common use cases.",
  },
];

const benefits = [
  "Stay within SMS character limits",
  "Avoid carrier spam filters",
  "Track SMS campaign performance",
  "Save space with ultra-short links",
  "Preview messages before sending",
  "Optimize for multi-segment messages",
];

const faqs = [
  {
    question: "How does SMS character counting work?",
    answer:
      "We calculate SMS segments based on GSM-7 (160 chars) and Unicode (70 chars) encoding. Multi-segment messages use 153/67 characters per segment. Our tool shows you exactly how many segments your message will use.",
  },
  {
    question: "Are Go2 links safe for SMS?",
    answer:
      "Yes! Our domains are carrier-safe and optimized for SMS delivery. We use short, memorable domains that won't trigger spam filters or get blocked by carriers.",
  },
  {
    question: "Can I track clicks from SMS separately?",
    answer:
      "Yes! All clicks from SMS campaigns are tracked with detailed analytics. You can see which SMS messages drive the most engagement and optimize your campaigns accordingly.",
  },
  {
    question: "What's the shortest link I can create?",
    answer:
      "SMS-optimized links use 4-character slugs by default, creating links like go2.gg/abcd. Combined with our short domain, this maximizes space savings in SMS messages.",
  },
];

export default function SMSFeaturePage() {
  return (
    <div className="bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="max-w-7xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-2 text-sm font-medium text-[var(--marketing-accent)] mb-6">
            <MessageSquare className="h-4 w-4" />
            SMS Optimization
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl text-[var(--marketing-text)]">
            Links Built for
            <span className="text-gradient block mt-2">SMS Marketing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--marketing-text-muted)]">
            Create SMS-optimized short links with character counting, carrier-safe domains, and
            dedicated tracking for your text marketing campaigns.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/features/links">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SMS Preview */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[var(--marketing-text-muted)]">
                  <Smartphone className="h-4 w-4" />
                  <span>SMS Preview</span>
                </div>
                <div className="rounded-lg bg-[var(--marketing-bg-elevated)] p-4 font-mono text-sm">
                  <div className="text-[var(--marketing-text-muted)] mb-2">Your message:</div>
                  <div className="text-[var(--marketing-text)]">
                    Check out our new product! go2.gg/abcd
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--marketing-text-muted)]">
                    <span>1 segment • 47/160 chars</span>
                    <span className="text-success">✓ Carrier-safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
            Everything You Need for SMS Links
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] max-w-2xl mx-auto">
            Tools and features designed specifically for SMS marketing campaigns.
          </p>
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

      {/* Benefits */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl px-4 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-4xl text-[var(--marketing-text)]">
                Why SMS-Optimized Links Matter
              </h2>
              <p className="mt-4 text-[var(--marketing-text-muted)]">
                SMS has strict character limits and carrier requirements. Our SMS features help you
                create links that work perfectly in text messages.
              </p>
              <ul className="mt-6 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-[var(--marketing-text)]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-xl">
              <div className="space-y-4">
                <div className="text-sm font-medium text-[var(--marketing-text-muted)]">
                  SMS Character Limits
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
                    <span className="text-sm text-[var(--marketing-text)]">
                      Single segment (GSM-7)
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--marketing-text)]">
                      160 chars
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
                    <span className="text-sm text-[var(--marketing-text)]">
                      Single segment (Unicode)
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--marketing-text)]">
                      70 chars
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
                    <span className="text-sm text-[var(--marketing-text)]">
                      Multi-segment (GSM-7)
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--marketing-text)]">
                      153 chars/segment
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
                    <span className="text-sm text-[var(--marketing-text)]">
                      Multi-segment (Unicode)
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--marketing-text)]">
                      67 chars/segment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-7xl px-4 py-16 md:py-24 bg-[var(--marketing-bg)]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-12 text-[var(--marketing-text)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
              >
                <h3 className="font-semibold text-lg mb-2 text-[var(--marketing-text)]">
                  {faq.question}
                </h3>
                <p className="text-[var(--marketing-text-muted)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
}

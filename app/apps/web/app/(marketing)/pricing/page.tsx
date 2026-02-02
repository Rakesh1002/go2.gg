import type { Metadata } from "next";
import { getMetadata, getFAQByCategory } from "@repo/config";
import { PricingSection, FAQSection, CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "Pricing",
  description:
    "Simple, transparent pricing for Go2 URL shortener. Free tier included. Custom domains, analytics, and API access.",
});

export default function PricingPage() {
  const pricingFAQ = getFAQByCategory("pricing");

  return (
    <>
      <PricingSection />

      <FAQSection
        headline="Pricing FAQ"
        subheadline="Common questions about pricing and billing."
        items={pricingFAQ}
      />

      <CTA
        headline="Ready to shorten your first link?"
        description="Get started in under a minute. Your links, your data, your control."
        primaryCTA={{ text: "Start free", href: "/register" }}
        secondaryCTA={{ text: "Book a demo", href: "/contact" }}
      />
    </>
  );
}

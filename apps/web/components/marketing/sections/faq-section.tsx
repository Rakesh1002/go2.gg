import { faqConfig, faqItems, type FAQItem } from "@repo/config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQSectionProps {
  headline?: string;
  subheadline?: string;
  items?: FAQItem[];
}

export function FAQSection({
  headline = faqConfig.headline,
  subheadline = faqConfig.subheadline,
  items = faqItems,
}: FAQSectionProps) {
  return (
    <section
      className="mx-auto max-w-7xl bg-[var(--marketing-bg)] px-4 py-16 sm:px-6 md:py-24 lg:px-8"
      id="faq"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl">
          {headline}
        </h2>
        <p className="mt-4 text-[var(--marketing-text-muted)] text-lg">{subheadline}</p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, _index) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-[var(--marketing-border)]"
            >
              <AccordionTrigger className="text-left text-[var(--marketing-text)] hover:text-[var(--marketing-accent)]">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[var(--marketing-text-muted)]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

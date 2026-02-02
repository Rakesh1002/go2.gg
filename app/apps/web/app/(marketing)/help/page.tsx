import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata, boilerplateConfig, faqItems } from "@repo/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  MessageCircle,
  Mail,
  Search,
  Zap,
  Link2,
  Globe,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "Support & Help",
  description: "Get help with Go2. Documentation, guides, and direct support.",
});

const supportChannels = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Comprehensive guides, API references, and tutorials.",
    href: "/docs",
    cta: "Browse Docs",
  },
  {
    icon: MessageCircle,
    title: "Community",
    description: "Join our Discord community for tips, help, and discussions.",
    href: boilerplateConfig.discordInvite,
    cta: "Join Discord",
    external: true,
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Direct support for Pro and Business customers.",
    href: `mailto:${boilerplateConfig.supportEmail}`,
    cta: "Send Email",
  },
];

const quickLinks = [
  { title: "Create Your First Link", href: "/docs/features/links", icon: Link2 },
  { title: "Add Custom Domain", href: "/docs/features/domains", icon: Globe },
  { title: "Understanding Analytics", href: "/docs/features/analytics", icon: BarChart3 },
  { title: "API Overview", href: "/docs/api/overview", icon: Zap },
  { title: "Links API", href: "/docs/api/links", icon: Link2 },
  { title: "Quick Start", href: "/docs/quickstart", icon: Zap },
];

export default function HelpPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <GeometricShapes position="hero-right" />

      <div className="max-w-7xl mx-auto relative px-4 py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            Help Center
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] md:text-5xl ">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">
            Find answers, get support, and learn how to get the most out of Go2.
          </p>

          {/* Search */}
          <div className="relative mx-auto mt-8 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--marketing-text-muted)]" />
            <Input
              type="search"
              placeholder="Search documentation..."
              className="h-12 pl-10 bg-[var(--marketing-bg-elevated)] border-[var(--marketing-border)] text-[var(--marketing-text)] focus-visible:ring-[var(--marketing-accent)]/20"
            />
          </div>
        </div>

        {/* Support Channels */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--marketing-text)] ">
            Support Channels
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {supportChannels.map((channel) => (
              <Card
                key={channel.title}
                className="border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
              >
                <CardContent className="flex flex-col items-center pt-6 text-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                    <channel.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--marketing-text)]">
                    {channel.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--marketing-text-muted)]">
                    {channel.description}
                  </p>
                  <Link
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    className="mt-4"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)] bg-transparent"
                    >
                      {channel.cta}
                      {channel.external && <ExternalLink className="h-3 w-3" />}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--marketing-text)] ">
            Popular Topics
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <Card className="transition-all hover:shadow-md hover:border-[var(--marketing-accent)]/30 border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] group">
                  <CardContent className="flex items-center gap-3 py-4">
                    <link.icon className="h-5 w-5 text-[var(--marketing-accent)] group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors">
                      {link.title}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--marketing-text)] ">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.slice(0, 8).map((item, index) => (
              <AccordionItem
                key={item.id}
                value={`faq-${index}`}
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

        {/* Contact CTA */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--marketing-text)] ">Still Need Help?</h2>
          <p className="mt-2 text-[var(--marketing-text-muted)]">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href={boilerplateConfig.discordInvite} target="_blank">
              <Button className="gap-2 bg-[var(--marketing-accent)] text-[var(--marketing-bg)] hover:bg-[var(--marketing-accent-light)]">
                <MessageCircle className="h-4 w-4" />
                Ask on Discord
              </Button>
            </Link>
            <Link href={`mailto:${boilerplateConfig.supportEmail}`}>
              <Button
                variant="outline"
                className="gap-2 border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)] bg-transparent"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

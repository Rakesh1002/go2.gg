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

const ownerFaqs = [
  {
    question: "I gave my agent an API key. How do I see exactly what it's been doing?",
    answer:
      "Open /dashboard/agent-runs — every link the agent has created is grouped by agent_id and agent_run_id, with click counts and first/last timestamps. Or call GET /api/v1/agent-attribution/runs to get the same data programmatically.",
  },
  {
    question: "How do I revoke every link a single run created?",
    answer:
      "Use the revoke_run_links MCP tool, or call the equivalent REST endpoint with the agent_run_id. All links from that run flip to archived and serve a 410 on every future click. Lifecycle is a parameter on creation, too — set 'expiresAt', 'singleUse: true', or 'revocableByRun: true' if you want guarantees up front.",
  },
  {
    question: "Can I scope an agent to only the links it created?",
    answer:
      "Yes, by issuing it an OAuth 2.1 token with narrow scopes (links:write, attribution:read) instead of a full org-level API key. The OAuth flow includes PKCE and dynamic client registration, so a third-party agent can register itself and get a workspace-scoped token without you ever sharing a long-lived secret.",
  },
  {
    question: "How do I move all my links onto my custom domain?",
    answer:
      "Add the domain in /dashboard/domains, verify the DNS-TXT record, then set it as the workspace default. New links created by you or your agent come out on that domain automatically. To rebrand existing links, you can bulk-update the slug or use the migrations endpoint to remap.",
  },
  {
    question: "If I cancel my agent's vendor, do I keep my links?",
    answer:
      "Yes. Links are stored against your userId and organizationId. The agent context (agent_id, agent_run_id) is metadata — useful for tracing, but never an ownership claim. Revoke the agent's API key or OAuth token; the links and click history stay in your workspace.",
  },
  {
    question: "Can my team see what each other's agents are doing?",
    answer:
      "Team members on the same organization see all agent runs scoped to that org, filtered by role. Owners and admins see everything; members see read-only by default. Use folders and tags to compartmentalize per-agent or per-project.",
  },
];

export default function HelpPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <GeometricShapes position="hero-right" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            Help Center
          </div>
          <h1 className="font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight md:text-5xl ">
            Help Center
          </h1>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-lg">
            Find answers, get support, and learn how to get the most out of Go2.
          </p>

          {/* Search */}
          <div className="relative mx-auto mt-8 max-w-md">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-[var(--marketing-text-muted)]" />
            <Input
              type="search"
              placeholder="Search documentation..."
              className="h-12 border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] pl-10 text-[var(--marketing-text)] focus-visible:ring-[var(--marketing-accent)]/20"
            />
          </div>
        </div>

        {/* Support Channels */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)] ">
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
                  <p className="mt-1 text-[var(--marketing-text-muted)] text-sm">
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
                      className="gap-1 border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
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
          <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)] ">
            Popular Topics
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <Card className="group border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 py-4">
                    <link.icon className="h-5 w-5 text-[var(--marketing-accent)] transition-transform group-hover:scale-110" />
                    <span className="font-medium text-[var(--marketing-text)] transition-colors group-hover:text-[var(--marketing-accent)]">
                      {link.title}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Owner FAQ — for the human whose agent works for them */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-2 text-center font-bold text-2xl text-[var(--marketing-text)] ">
            For link owners with agents
          </h2>
          <p className="mb-8 text-center text-[var(--marketing-text-muted)] text-sm">
            Questions from operators whose agent creates links on their behalf.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {ownerFaqs.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`owner-faq-${index}`}
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

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center font-bold text-2xl text-[var(--marketing-text)] ">
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
          <h2 className="font-bold text-[var(--marketing-text)] text-xl ">Still Need Help?</h2>
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
                className="gap-2 border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
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

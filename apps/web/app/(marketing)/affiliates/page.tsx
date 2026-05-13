import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { CTA } from "@/components/marketing/sections";
import { DollarSign, Gift, Send, Users } from "lucide-react";

export const metadata: Metadata = getMetadata({
  title: "Affiliate program",
  description:
    "Earn 40% recurring commission for every Go2 customer you refer. Lifetime payouts, 30-day attribution window, instant approval.",
});

const steps = [
  {
    icon: Gift,
    title: "Apply in one click",
    desc: "No interview, no minimum follower count. You're approved instantly with a personal sharing link at go2.gg/r/CODE.",
  },
  {
    icon: Users,
    title: "Share your link",
    desc: "Drop it in a tweet, your blog post, your README, a YouTube description. Cookie attribution lasts 30 days from first click.",
  },
  {
    icon: DollarSign,
    title: "Earn on every paid invoice",
    desc: "When your referral pays Go2, 40% lands in your pending balance. Recurring — not just first month. Refunds reverse automatically.",
  },
  {
    icon: Send,
    title: "Get paid via PayPal",
    desc: "Payouts on the 1st of every month for balances over $50. No coupons, no clawbacks past the refund window.",
  },
];

const faqs = [
  {
    q: "How much can I earn per referral?",
    a: "40% of every paid invoice, for as long as the referred customer keeps their subscription. A Business-tier customer at $49/mo earns you $19.60/mo recurring. A Scale-tier customer at $499/mo earns you $199.60/mo.",
  },
  {
    q: "When does the cookie expire?",
    a: "30 days from the first click on your link. If they sign up within 30 days — even after closing the browser — you get credit.",
  },
  {
    q: "What about refunds?",
    a: "If the customer refunds an invoice, the matching commission is automatically reversed from your pending balance. Already-paid commissions are not clawed back beyond Stripe's standard refund window.",
  },
  {
    q: "Can I refer myself?",
    a: "No. Self-referrals are detected and rejected. Don't try to be cute.",
  },
  {
    q: "Are coupons / promo codes counted?",
    a: "Yes — the commission is calculated on the actual amount paid (after discounts). If a customer pays $24.50 with a 50%-off code on a $49 plan, you earn $9.80.",
  },
  {
    q: "How do I get paid?",
    a: "Add your PayPal email in the affiliate dashboard. We send payouts on the 1st of each month for balances over $50.",
  },
];

export default function AffiliatesMarketingPage() {
  return (
    <>
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-primary text-xs">
            <Gift className="h-3.5 w-3.5" /> Affiliate program
          </div>
          <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
            Earn 40% recurring on every Go2 referral.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Lifetime commission. 30-day cookie window. Approved instantly. Paid monthly via PayPal.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/dashboard/affiliates"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Join the program
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium hover:bg-muted/50"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-10 text-center font-bold text-3xl tracking-tight">How it works</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-lg border bg-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mb-1 text-muted-foreground text-xs">Step {i + 1}</p>
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center font-bold text-3xl tracking-tight">FAQ</h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="mb-1 font-semibold">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <CTA
        headline="Ready to share Go2?"
        description="Apply in one click. Approved instantly. Start earning today."
        primaryCTA={{ text: "Join the affiliate program", href: "/dashboard/affiliates" }}
        secondaryCTA={{ text: "See pricing", href: "/pricing" }}
      />
    </>
  );
}

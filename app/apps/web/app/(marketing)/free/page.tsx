import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Link2, BarChart2, QrCode, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free URL Shortener | No Signup Required | Go2",
  description:
    "100% free URL shortener with no signup required. Shorten links instantly, track clicks, and generate QR codes. Unlimited redirects, forever free.",
  keywords: [
    "free url shortener",
    "free link shortener",
    "url shortener no signup",
    "free short link",
    "shorten url free",
    "link shortener free",
    "tiny url free",
  ],
  openGraph: {
    title: "Free URL Shortener | Go2",
    description: "Shorten links for free. No signup, no limits on redirects, forever free.",
    type: "website",
  },
};

const freeFeatures = [
  {
    title: "Up to 50 Links",
    description: "Create up to 50 short links on our free plan",
    icon: Link2,
  },
  {
    title: "Unlimited Clicks",
    description: "No limits on how many times your links can be clicked",
    icon: Zap,
  },
  {
    title: "Basic Analytics",
    description: "See total clicks and basic performance data",
    icon: BarChart2,
  },
  {
    title: "QR Codes",
    description: "Get a free QR code for every shortened link",
    icon: QrCode,
  },
  {
    title: "SSL Encryption",
    description: "All links are secured with HTTPS",
    icon: Shield,
  },
  {
    title: "Global CDN",
    description: "Fast redirects from servers worldwide",
    icon: Globe,
  },
];

const comparisonFeatures = [
  { feature: "Short links", free: "50", pro: "500/mo", business: "5,000/mo" },
  { feature: "Custom domains", free: "1", pro: "5", business: "25" },
  { feature: "Click analytics", free: "Basic", pro: "Advanced", business: "Advanced" },
  { feature: "QR codes", free: "✓", pro: "✓", business: "✓" },
  { feature: "Custom slugs", free: "✓", pro: "✓", business: "✓" },
  { feature: "API access", free: "✓", pro: "✓", business: "✓" },
  { feature: "Team members", free: "1", pro: "1", business: "5" },
  { feature: "Link-in-bio", free: "—", pro: "1", business: "10" },
];

export default function FreePage() {
  return (
    <div className="max-w-7xl py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">
          100% Free
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Free URL Shortener</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Shorten URLs instantly with no signup required. Get click analytics, QR codes, and more —
          completely free.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start Shortening Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • No signup for basic shortening
        </p>
      </div>

      {/* Free Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">What's Included Free</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Free vs. Paid Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold bg-green-50">
                  <div>Free</div>
                  <div className="text-sm font-normal text-muted-foreground">$0/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold">
                  <div>Pro</div>
                  <div className="text-sm font-normal text-muted-foreground">$9/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold">
                  <div>Business</div>
                  <div className="text-sm font-normal text-muted-foreground">$49/mo</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.feature} className="border-b">
                  <td className="py-4 px-4">{row.feature}</td>
                  <td className="text-center py-4 px-4 bg-green-50">{row.free}</td>
                  <td className="text-center py-4 px-4">{row.pro}</td>
                  <td className="text-center py-4 px-4">{row.business}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-6">
          <Button variant="outline" asChild>
            <Link href="/pricing">View Full Plan Comparison</Link>
          </Button>
        </div>
      </div>

      {/* Why Free */}
      <div className="bg-muted/50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-6">Why We Offer a Free Plan</h2>
        <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground">
          <p>
            We believe everyone should have access to a great URL shortener. Whether you're a
            student, small business, or just someone who wants cleaner links — our free plan has you
            covered.
          </p>
          <p>
            Our free tier is supported by our paid plans. As your needs grow, you can upgrade to
            access more features like custom domains, API access, and team collaboration.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Free Plan FAQ</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold mb-2">Is it really free?</h3>
            <p className="text-muted-foreground">
              Yes! Our free plan is 100% free, forever. No trial period, no hidden fees. You can use
              it as long as you want with no credit card required.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">What are the limits?</h3>
            <p className="text-muted-foreground">
              Free accounts can create up to 50 short links and 1 custom domain. There are no limits
              on clicks — your links will always work no matter how popular they get.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Do free links expire?</h3>
            <p className="text-muted-foreground">
              No, free links never expire. They'll continue working as long as your account is
              active. We don't delete inactive links.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Can I upgrade later?</h3>
            <p className="text-muted-foreground">
              Absolutely! You can upgrade to Pro or Business anytime. All your existing links and
              data will be preserved when you upgrade.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits List */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Why Go2 is the Best Free URL Shortener
        </h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            "No signup required for basic shortening",
            "Links never expire or get deleted",
            "No ads or pop-ups on redirect pages",
            "Fast, reliable redirects worldwide",
            "Free QR code for every link",
            "Basic click analytics included",
            "SSL encryption on all links",
            "24/7 uptime guarantee",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to start shortening links?</h2>
        <p className="text-muted-foreground mb-6">
          Join millions of users who trust Go2 for their link management.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Free forever • No credit card • Upgrade anytime
        </p>
      </div>
    </div>
  );
}

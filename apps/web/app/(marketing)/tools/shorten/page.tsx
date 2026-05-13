import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Link2, BarChart2, Zap, Globe, Shield, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free URL Shortener | Shorten Links Instantly",
  description:
    "Shorten URLs for free with Go2. Create short, branded links with analytics, QR codes, and more. No signup required for basic shortening.",
  keywords: [
    "url shortener",
    "link shortener",
    "shorten url",
    "short link",
    "free url shortener",
    "custom short url",
    "link tracker",
  ],
  openGraph: {
    title: "Free URL Shortener | Go2",
    description: "Create short, powerful links with analytics and QR codes. Free to use.",
    type: "website",
  },
};

const useCases = [
  {
    title: "YouTube Link Shortener",
    description: "Create memorable short links for your YouTube videos and channels",
    href: "/tools/shorten/youtube",
    icon: "🎬",
  },
  {
    title: "Twitter/X Link Shortener",
    description: "Share cleaner links in tweets with tracking",
    href: "/tools/shorten/twitter",
    icon: "🐦",
  },
  {
    title: "TikTok Link Shortener",
    description: "Short links perfect for TikTok bio and captions",
    href: "/tools/shorten/tiktok",
    icon: "🎵",
  },
  {
    title: "Instagram Bio Links",
    description: "Create trackable links for your Instagram bio",
    href: "/tools/shorten/instagram",
    icon: "📸",
  },
  {
    title: "Amazon Affiliate Links",
    description: "Shorten and track your Amazon affiliate URLs",
    href: "/tools/shorten/amazon",
    icon: "🛒",
  },
  {
    title: "Spotify Link Shortener",
    description: "Share music and podcasts with clean short links",
    href: "/tools/shorten/spotify",
    icon: "🎧",
  },
];

const features = [
  {
    title: "Instant Shortening",
    description: "Paste your URL and get a short link in milliseconds",
    icon: Zap,
  },
  {
    title: "Click Analytics",
    description: "Track clicks, locations, devices, and referrers",
    icon: BarChart2,
  },
  {
    title: "Custom Slugs",
    description: "Create memorable branded short links",
    icon: Link2,
  },
  {
    title: "Global CDN",
    description: "Lightning-fast redirects from edge servers worldwide",
    icon: Globe,
  },
  {
    title: "Enterprise Security",
    description: "SSL encryption, malware protection, and GDPR compliance",
    icon: Shield,
  },
  {
    title: "QR Code Generation",
    description: "Get QR codes for every shortened link automatically",
    icon: QrCode,
  },
];

export default function ShortenPage() {
  return (
    <div className="max-w-7xl py-12">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">Free URL Shortener</h1>
        <p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl">
          Create short, powerful links in seconds. Track clicks, customize URLs, and generate QR
          codes — all for free.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start Shortening <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>

      {/* Quick shortener embed would go here */}
      <div className="mb-16 rounded-lg bg-muted/50 p-8 text-center">
        <h2 className="mb-4 font-semibold text-2xl">Try It Now</h2>
        <p className="mb-4 text-muted-foreground">No signup required for basic link shortening</p>
        <Button asChild>
          <Link href="/dashboard">Open URL Shortener</Link>
        </Button>
      </div>

      {/* Features */}
      <div className="mb-16">
        <h2 className="mb-8 text-center font-bold text-3xl">Why Choose Go2?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-16">
        <h2 className="mb-8 text-center font-bold text-3xl">URL Shorteners by Platform</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <Link key={useCase.title} href={useCase.href}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="mb-2 text-4xl">{useCase.icon}</div>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ Schema */}
      <div className="mb-16">
        <h2 className="mb-8 text-center font-bold text-3xl">Frequently Asked Questions</h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h3 className="mb-2 font-semibold text-lg">Is Go2 free to use?</h3>
            <p className="text-muted-foreground">
              Yes! Go2 offers a free tier with up to 50 short links, basic analytics, and QR codes.
              Upgrade to Pro or Business for more links, custom domains, and advanced features.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">Are short links permanent?</h3>
            <p className="text-muted-foreground">
              Yes, links created on Go2 are permanent and never expire unless you set an expiration
              date. Your short links will continue to work as long as your account is active.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">Can I track link clicks?</h3>
            <p className="text-muted-foreground">
              Absolutely. Every short link includes detailed analytics: total clicks, geographic
              data, device types, browsers, referrers, and click timing — all in real-time.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">Can I use my own domain?</h3>
            <p className="text-muted-foreground">
              Yes! Pro and Business plans support custom domains. Use your brand's domain (like
              links.yourbrand.com) for professional, branded short links.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="mb-4 font-bold text-2xl">Ready to shorten your first link?</h2>
        <p className="mb-6 text-muted-foreground">
          Join thousands of businesses and creators using Go2.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

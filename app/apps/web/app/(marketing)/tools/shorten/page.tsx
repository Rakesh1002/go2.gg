import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Link2, BarChart2, Zap, Globe, Shield, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free URL Shortener | Shorten Links Instantly | Go2",
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
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Free URL Shortener</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Create short, powerful links in seconds. Track clicks, customize URLs, and generate QR
          codes — all for free.
        </p>
        <div className="flex gap-4 justify-center">
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
      <div className="bg-muted/50 rounded-lg p-8 mb-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Try It Now</h2>
        <p className="text-muted-foreground mb-4">No signup required for basic link shortening</p>
        <Button asChild>
          <Link href="/dashboard">Open URL Shortener</Link>
        </Button>
      </div>

      {/* Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Go2?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
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

      {/* Use Cases */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">URL Shorteners by Platform</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <Link key={useCase.title} href={useCase.href}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <div className="text-4xl mb-2">{useCase.icon}</div>
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
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold mb-2">Is Go2 free to use?</h3>
            <p className="text-muted-foreground">
              Yes! Go2 offers a free tier with up to 50 short links, basic analytics, and QR codes.
              Upgrade to Pro or Business for more links, custom domains, and advanced features.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Are short links permanent?</h3>
            <p className="text-muted-foreground">
              Yes, links created on Go2 are permanent and never expire unless you set an expiration
              date. Your short links will continue to work as long as your account is active.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Can I track link clicks?</h3>
            <p className="text-muted-foreground">
              Absolutely. Every short link includes detailed analytics: total clicks, geographic
              data, device types, browsers, referrers, and click timing — all in real-time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Can I use my own domain?</h3>
            <p className="text-muted-foreground">
              Yes! Pro and Business plans support custom domains. Use your brand's domain (like
              links.yourbrand.com) for professional, branded short links.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to shorten your first link?</h2>
        <p className="text-muted-foreground mb-6">
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

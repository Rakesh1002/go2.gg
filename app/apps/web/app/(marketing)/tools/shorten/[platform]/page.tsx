import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Link2, BarChart2, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Platform configurations for SEO
const platforms: Record<
  string,
  {
    name: string;
    title: string;
    description: string;
    keywords: string[];
    icon: string;
    color: string;
    benefits: string[];
    useCases: string[];
    tips: string[];
  }
> = {
  youtube: {
    name: "YouTube",
    title: "YouTube URL Shortener | Shorten YouTube Links | Go2",
    description:
      "Create short, trackable links for YouTube videos and channels. Perfect for sharing in descriptions, comments, and social media. Free to use with analytics.",
    keywords: [
      "youtube url shortener",
      "shorten youtube link",
      "youtube video short link",
      "youtube link tracker",
      "youtube analytics link",
    ],
    icon: "🎬",
    color: "#FF0000",
    benefits: [
      "Track how many people click your video links",
      "Create memorable branded links for your channel",
      "Share cleaner URLs in video descriptions",
      "Get QR codes for offline promotion",
    ],
    useCases: [
      "Video descriptions linking to other content",
      "Comments and community posts",
      "Cross-platform promotion on Twitter/Instagram",
      "Email newsletters and marketing",
      "Business cards and printed materials",
    ],
    tips: [
      "Use descriptive slugs like go2.gg/my-tutorial",
      "Add UTM parameters to track traffic sources",
      "Create a branded domain for your channel",
      "Use QR codes in your video thumbnails for printed promos",
    ],
  },
  twitter: {
    name: "Twitter/X",
    title: "Twitter URL Shortener | Shorten Links for X | Go2",
    description:
      "Create short, trackable links perfect for tweets. Save characters, track engagement, and create branded links for Twitter/X. Free URL shortener with analytics.",
    keywords: [
      "twitter url shortener",
      "twitter link shortener",
      "shorten link for tweet",
      "x link shortener",
      "tweet link tracker",
    ],
    icon: "🐦",
    color: "#1DA1F2",
    benefits: [
      "Save precious characters in your tweets",
      "Track click-through rates on shared links",
      "Create memorable branded links",
      "A/B test different link versions",
    ],
    useCases: [
      "Sharing articles and blog posts",
      "Promoting products and services",
      "Linking to your bio or landing pages",
      "Running Twitter ad campaigns",
      "Thread conclusions with call-to-actions",
    ],
    tips: [
      "Keep slugs short but descriptive",
      "Use the same slug across platforms for consistency",
      "Track engagement with real-time analytics",
      "Create different links for different audiences to track performance",
    ],
  },
  tiktok: {
    name: "TikTok",
    title: "TikTok URL Shortener | Links for TikTok Bio | Go2",
    description:
      "Create short links perfect for TikTok bio and video captions. Track clicks from TikTok traffic and create memorable branded URLs. Free link shortener.",
    keywords: [
      "tiktok url shortener",
      "tiktok bio link",
      "link in bio tiktok",
      "tiktok link tracker",
      "shorten tiktok link",
    ],
    icon: "🎵",
    color: "#010101",
    benefits: [
      "Create clean, memorable bio links",
      "Track traffic from TikTok to your site",
      "Multiple links with link-in-bio pages",
      "Mobile-optimized redirect experience",
    ],
    useCases: [
      "Bio link to your website or store",
      "Product links mentioned in videos",
      "Affiliate marketing links",
      "Creator monetization tools",
      "Cross-promotion to other platforms",
    ],
    tips: [
      "Use a link-in-bio page for multiple destinations",
      "Update your bio link based on recent content",
      "Use retargeting pixels to capture TikTok audience",
      "Track which videos drive the most bio clicks",
    ],
  },
  instagram: {
    name: "Instagram",
    title: "Instagram Bio Link Shortener | Links for IG | Go2",
    description:
      "Create trackable short links for your Instagram bio. Perfect for creators, businesses, and influencers. Track clicks and create branded URLs for free.",
    keywords: [
      "instagram url shortener",
      "instagram bio link",
      "link in bio instagram",
      "ig link tracker",
      "instagram link shortener",
    ],
    icon: "📸",
    color: "#E4405F",
    benefits: [
      "Track bio link clicks and conversions",
      "Create branded, memorable URLs",
      "Use link-in-bio for multiple destinations",
      "Retarget Instagram visitors",
    ],
    useCases: [
      "Single bio link to your store",
      "Link-in-bio page with multiple links",
      "Story link stickers (with tracking)",
      "DM automation links",
      "Collab and campaign tracking",
    ],
    tips: [
      "Change your bio link based on current promotions",
      "Use UTM parameters to track Instagram traffic",
      "Create a branded domain for credibility",
      "Use QR codes in Stories for engagement",
    ],
  },
  amazon: {
    name: "Amazon",
    title: "Amazon Affiliate Link Shortener | Track Amazon Links | Go2",
    description:
      "Shorten and track Amazon affiliate links. Create clean URLs for your affiliate marketing while maintaining your affiliate tags. Free to use.",
    keywords: [
      "amazon affiliate link shortener",
      "shorten amazon link",
      "amazon url shortener",
      "affiliate link tracker",
      "amazon associates link",
    ],
    icon: "🛒",
    color: "#FF9900",
    benefits: [
      "Clean URLs that don't look spammy",
      "Track which content drives sales",
      "Compare performance across platforms",
      "Mask long affiliate URLs",
    ],
    useCases: [
      "Blog posts with product recommendations",
      "YouTube video descriptions",
      "Social media product shares",
      "Email newsletters",
      "Comparison articles",
    ],
    tips: [
      "Always include your affiliate tag in the destination URL",
      "Use descriptive slugs like go2.gg/best-headphones",
      "Track different links per content piece",
      "Comply with Amazon Associates disclosure requirements",
    ],
  },
  spotify: {
    name: "Spotify",
    title: "Spotify URL Shortener | Share Music Links | Go2",
    description:
      "Create short, trackable links for Spotify tracks, playlists, and podcasts. Perfect for musicians, podcasters, and curators. Free link shortener.",
    keywords: [
      "spotify url shortener",
      "shorten spotify link",
      "spotify playlist link",
      "spotify podcast link",
      "music link shortener",
    ],
    icon: "🎧",
    color: "#1DB954",
    benefits: [
      "Track how many people click your music links",
      "Create branded links for your artist profile",
      "Share cleaner URLs on social media",
      "Monitor playlist and podcast performance",
    ],
    useCases: [
      "New song/album release promotion",
      "Podcast episode sharing",
      "Playlist curation and sharing",
      "Artist bio and social profiles",
      "Press releases and PR",
    ],
    tips: [
      "Create unique links for each release",
      "Track performance across different platforms",
      "Use QR codes on physical merchandise",
      "A/B test different album art with link previews",
    ],
  },
};

interface Props {
  params: Promise<{ platform: string }>;
}

export async function generateStaticParams() {
  return Object.keys(platforms).map((platform) => ({
    platform,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform } = await params;
  const config = platforms[platform];

  if (!config) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      title: config.title,
      description: config.description,
      type: "website",
    },
  };
}

export default async function PlatformShortenPage({ params }: Props) {
  const { platform } = await params;
  const config = platforms[platform];

  if (!config) {
    notFound();
  }

  return (
    <div className="max-w-7xl py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-8">
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>
        {" / "}
        <Link href="/tools/shorten" className="hover:text-foreground">
          URL Shortener
        </Link>
        {" / "}
        <span className="text-foreground">{config.name}</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-4">{config.icon}</div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          {config.name} URL Shortener
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Create short, trackable links for {config.name}. Perfect for sharing, tracking engagement,
          and building your brand.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Shorten {config.name} Link <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Why Shorten {config.name} Links?</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {config.benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <Card>
          <CardHeader>
            <Link2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Custom Slugs</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create memorable links like go2.gg/my-{platform}-content
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <BarChart2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Click Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Track every click with detailed analytics and insights
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <QrCode className="h-8 w-8 text-primary mb-2" />
            <CardTitle>QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Auto-generated QR codes for offline sharing</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Share2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Easy Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>One-click copy and share across all platforms</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Use Cases */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Popular Use Cases for {config.name} Links
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {config.useCases.map((useCase) => (
            <div key={useCase} className="bg-muted/50 rounded-lg p-4 text-center">
              {useCase}
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mb-16 bg-primary/5 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Pro Tips for {config.name} Link Shortening
        </h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {config.tips.map((tip, idx) => (
            <div key={tip} className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Other Platforms */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-6">URL Shorteners for Other Platforms</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {Object.entries(platforms)
            .filter(([key]) => key !== platform)
            .map(([key, p]) => (
              <Link key={key} href={`/tools/shorten/${key}`}>
                <Button variant="outline" className="gap-2">
                  <span>{p.icon}</span>
                  {p.name}
                </Button>
              </Link>
            ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-muted rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to shorten your {config.name} links?</h2>
        <p className="text-muted-foreground mb-6">
          Create your first short link in seconds. No credit card required.
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

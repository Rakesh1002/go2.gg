import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { User, BarChart3, Smartphone, Share2, Palette, QrCode } from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { IntegrationLogos } from "@/components/marketing/sections/integration-logos";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Creators - Link in Bio That's Actually Yours",
  description:
    "Branded bio pages with custom CSS. Track your audience. Smart links for affiliates. Free custom domains. No Linktree watermark.",
});

const useCases = [
  {
    icon: User,
    title: "Bio Pages You Own",
    description:
      "No watermarks. Custom CSS support. Use your own domain. Your bio page should represent you, not us.",
  },
  {
    icon: BarChart3,
    title: "Know Your Audience",
    description:
      "Real-time analytics show where fans click, which content performs, and where your audience is located.",
  },
  {
    icon: Smartphone,
    title: "Smart Device Links",
    description:
      "One link that detects iOS vs Android. Send fans to the right app store, streaming service, or store.",
  },
  {
    icon: Palette,
    title: "Unlimited Themes + Custom CSS",
    description:
      "Choose from beautiful themes or write custom CSS. Linktree charges $9/mo for customization.",
  },
  {
    icon: QrCode,
    title: "AI QR Codes",
    description:
      "Generate stunning QR codes for merch, posters, and promotions. Embed your logo. Track scans.",
  },
  {
    icon: Share2,
    title: "All Your Links, One Place",
    description:
      "YouTube, TikTok, Spotify, Patreon — all your platforms in a beautiful, fast-loading page.",
  },
];

const benefits = [
  "Free custom domain (Linktree charges $9/mo)",
  "No watermark on any plan",
  "Custom CSS support — full design control",
  "Track every click in real-time",
  "Affiliate link cloaking built-in",
  "QR codes for merch and promotions",
  "Schedule links for drops and launches",
  "50 free links — more than enough to start",
];

const creatorStats = [
  { value: "Free", label: "Custom Domain", description: "Linktree charges $9/mo" },
  { value: "0", label: "Watermarks", description: "Your brand only" },
  { value: "50+", label: "Free Links", description: "Enough to start" },
  { value: "100%", label: "CSS Control", description: "Full customization" },
];

const creatorIntegrations = [
  { name: "YouTube" },
  { name: "TikTok" },
  { name: "Instagram" },
  { name: "Spotify" },
  { name: "Patreon" },
  { name: "Ko-fi" },
  { name: "Twitch" },
  { name: "Discord" },
];

const creatorFaqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes. The free plan includes 50 links, a bio page, basic analytics, and even a custom domain. No credit card required.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! Free custom domains are included on all plans. Use yourname.com or any domain you own.",
  },
  {
    question: "Is there a Linktree watermark?",
    answer:
      "No. Unlike Linktree and other competitors, we never show watermarks on any plan — including Free.",
  },
  {
    question: "Can I customize the design?",
    answer:
      "Yes. Choose from beautiful themes or write your own CSS. Linktree charges $9/mo for basic customization.",
  },
];

export default function CreatorsPage() {
  return (
    <SolutionsPageTemplate
      badge="Made for Creators"
      title="Your Bio Link, Your Brand"
      subtitle="Stop paying for basic customization. Get branded bio pages with custom domains, no watermarks, and full CSS control. Free to start."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Claim your bio link"
      ctaDescription="Free forever for personal use. No credit card required."
      stats={
        <MetricsHighlight headline="Everything free competitors charge for" stats={creatorStats} />
      }
      integrations={
        <IntegrationLogos
          headline="Connect all your platforms"
          subheadline="Beautiful icons and embeds for every social network"
          integrations={creatorIntegrations}
        />
      }
      faqs={creatorFaqs}
    />
  );
}

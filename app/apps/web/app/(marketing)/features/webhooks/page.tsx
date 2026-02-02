import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";
import { Webhook, Zap, Shield, RefreshCw, Code, Bell } from "lucide-react";

export const metadata: Metadata = getMetadata({
  title: "Webhooks - Real-Time Event Streaming",
  description:
    "Receive real-time notifications when links are clicked, created, or updated. Build powerful integrations with Go2 webhooks.",
});

const features = [
  {
    icon: Zap,
    title: "Real-Time Events",
    description: "Get notified instantly when clicks, link creations, and other events occur.",
  },
  {
    icon: Shield,
    title: "Signature Verification",
    description: "Every webhook includes an HMAC signature for secure payload verification.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Retries",
    description: "Failed deliveries are retried automatically with exponential backoff.",
  },
  {
    icon: Code,
    title: "Rich Payloads",
    description: "Receive detailed JSON payloads with all relevant event data.",
  },
  {
    icon: Bell,
    title: "Multiple Events",
    description: "Subscribe to clicks, link.created, link.updated, link.deleted, and more.",
  },
  {
    icon: Webhook,
    title: "Easy Testing",
    description: "Send test events to verify your integration before going live.",
  },
];

const benefits = [
  "Real-time click streaming for analytics pipelines",
  "Sync link changes to your CMS or database",
  "Trigger workflows in Zapier, Make, or n8n",
  "Build custom dashboards and reports",
  "Power notification systems",
  "Integrate with Slack, Discord, or email",
];

const faqs = [
  {
    question: "What events can I subscribe to?",
    answer:
      "You can subscribe to: click (when a link is clicked), link.created, link.updated, link.deleted, domain.verified, and qr.scanned. Use '*' to receive all events.",
  },
  {
    question: "How do I verify webhook signatures?",
    answer:
      "Each webhook includes an X-Webhook-Signature header containing an HMAC-SHA256 signature. Use your webhook secret to verify the payload hasn't been tampered with.",
  },
  {
    question: "What happens if my endpoint is down?",
    answer:
      "We automatically retry failed deliveries with exponential backoff. After 10 consecutive failures, the webhook is automatically disabled (you can re-enable it anytime).",
  },
  {
    question: "Can I see webhook delivery history?",
    answer:
      "Yes! The dashboard shows recent deliveries with status codes, response times, and any error messages.",
  },
];

export default function WebhooksFeaturePage() {
  return (
    <FeaturePageTemplate
      badge="Webhooks"
      title="Real-Time Events for Your Stack"
      subtitle="Receive instant notifications when events happen in your Go2 account. Build powerful integrations and automated workflows."
      features={features}
      benefits={benefits}
      faqs={faqs}
      ctaTitle="Start Building"
      ctaDescription="Create your first webhook in minutes."
    />
  );
}

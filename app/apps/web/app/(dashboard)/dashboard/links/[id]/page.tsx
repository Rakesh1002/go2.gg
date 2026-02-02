import type { Metadata } from "next";
import { LinkAnalyticsClient } from "./link-analytics-client";

export const metadata: Metadata = {
  title: "Link Analytics | Go2",
  description: "View analytics for your short link",
};

interface LinkAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function LinkAnalyticsPage({ params }: LinkAnalyticsPageProps) {
  const { id } = await params;

  return <LinkAnalyticsClient linkId={id} />;
}

import type { Metadata } from "next";
import { ABTestsPageGate } from "../ab-tests-page-gate";
import { ABTestResultsClient } from "./results-client";

export const metadata: Metadata = {
  title: "A/B Test Results | Dashboard",
  description: "View variant performance and pick a winner",
};

export default async function ABTestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ABTestsPageGate>
      <ABTestResultsClient testId={id} />
    </ABTestsPageGate>
  );
}

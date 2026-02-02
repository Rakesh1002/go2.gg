"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface WebhooksPageGateProps {
  children: React.ReactNode;
}

export function WebhooksPageGate({ children }: WebhooksPageGateProps) {
  return <LockedFeaturePage feature="webhooks">{children}</LockedFeaturePage>;
}

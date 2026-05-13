"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface ConversionsPageGateProps {
  children: React.ReactNode;
}

export function ConversionsPageGate({ children }: ConversionsPageGateProps) {
  return <LockedFeaturePage feature="conversionTracking">{children}</LockedFeaturePage>;
}

"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface ABTestsPageGateProps {
  children: React.ReactNode;
}

export function ABTestsPageGate({ children }: ABTestsPageGateProps) {
  return <LockedFeaturePage feature="abTesting">{children}</LockedFeaturePage>;
}

"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface BioPageGateProps {
  children: React.ReactNode;
}

export function BioPageGate({ children }: BioPageGateProps) {
  return <LockedFeaturePage feature="bioPages">{children}</LockedFeaturePage>;
}

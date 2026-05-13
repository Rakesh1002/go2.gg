"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface TeamPageGateProps {
  children: React.ReactNode;
}

export function TeamPageGate({ children }: TeamPageGateProps) {
  return <LockedFeaturePage feature="teamMembers">{children}</LockedFeaturePage>;
}

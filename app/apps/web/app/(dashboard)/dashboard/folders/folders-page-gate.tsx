"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface FoldersPageGateProps {
  children: React.ReactNode;
}

export function FoldersPageGate({ children }: FoldersPageGateProps) {
  return <LockedFeaturePage feature="folders">{children}</LockedFeaturePage>;
}

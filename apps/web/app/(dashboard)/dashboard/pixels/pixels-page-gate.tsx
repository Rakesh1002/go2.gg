"use client";

import { LockedFeaturePage } from "@/components/locked-feature-page";

interface PixelsPageGateProps {
  children: React.ReactNode;
}

export function PixelsPageGate({ children }: PixelsPageGateProps) {
  return <LockedFeaturePage feature="pixelTracking">{children}</LockedFeaturePage>;
}

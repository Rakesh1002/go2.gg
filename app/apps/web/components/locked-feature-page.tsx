"use client";

import Link from "next/link";
import { Lock, Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Feature, featureInfo, getPlanDisplayName } from "@/lib/feature-gates";
import { useSubscription } from "@/contexts/subscription-context";
import { Skeleton } from "@/components/ui/skeleton";

interface LockedFeaturePageProps {
  feature: Feature;
  children: React.ReactNode;
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  description?: string;
  /** Optional preview image/screenshot */
  previewImage?: string;
}

/**
 * Wrapper component that gates page content based on subscription plan.
 * Shows a locked state with upgrade prompt if user doesn't have access.
 */
export function LockedFeaturePage({
  feature,
  children,
  title,
  description,
  previewImage,
}: LockedFeaturePageProps) {
  const { canAccess, loading, subscription } = useSubscription();

  if (loading) {
    return <LockedFeaturePageSkeleton />;
  }

  // User has access - render children
  if (canAccess(feature)) {
    return <>{children}</>;
  }

  // User doesn't have access - render locked state
  const info = featureInfo[feature];
  const requiredPlanName = getPlanDisplayName(info.requiredPlan);
  const currentPlanName = getPlanDisplayName(subscription.plan);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-lg border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Lock Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Feature Name */}
          <h1 className="text-2xl font-bold mb-2">{title || info.name}</h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {description || info.description}
          </p>

          {/* Required Plan Badge */}
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Requires {requiredPlanName} plan
            </Badge>
          </div>

          {/* Benefits List */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-3">Upgrade to {requiredPlanName} to unlock:</p>
            <ul className="space-y-2">
              {info.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard/billing">
                Upgrade to {requiredPlanName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">Compare Plans</Link>
            </Button>
          </div>

          {/* Current Plan Info */}
          <p className="text-xs text-muted-foreground mt-6">
            You're currently on the <span className="font-medium">{currentPlanName}</span> plan
          </p>
        </CardContent>
      </Card>

      {/* Optional Preview Image */}
      {previewImage && (
        <div className="mt-8 w-full max-w-2xl">
          <div className="relative rounded-lg overflow-hidden border bg-muted/30">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <img
              src={previewImage}
              alt={`${info.name} preview`}
              className="w-full opacity-50 blur-[2px]"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">Preview of {info.name}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline feature gate component for gating sections within a page
 */
interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** Fallback content when feature is locked (defaults to inline upgrade prompt) */
  fallback?: React.ReactNode;
  /** If true, shows nothing when locked instead of upgrade prompt */
  hideWhenLocked?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  hideWhenLocked = false,
}: FeatureGateProps) {
  const { canAccess, loading } = useSubscription();

  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default inline upgrade prompt
  const info = featureInfo[feature];
  const requiredPlanName = getPlanDisplayName(info.requiredPlan);

  return (
    <div className="rounded-lg border border-dashed p-4 bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{info.name}</p>
          <p className="text-xs text-muted-foreground">
            Upgrade to {requiredPlanName} to unlock this feature
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/billing">Upgrade</Link>
        </Button>
      </div>
    </div>
  );
}

function LockedFeaturePageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-8 w-48" />
          <Skeleton className="mx-auto mb-6 h-4 w-64" />
          <Skeleton className="mx-auto mb-6 h-6 w-32" />
          <Skeleton className="mx-auto mb-6 h-32 w-full" />
          <div className="flex gap-3 justify-center">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

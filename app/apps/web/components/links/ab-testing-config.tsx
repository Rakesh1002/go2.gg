"use client";

import Link from "next/link";
import { Plus, Trash2, Lock, Sparkles, FlaskConical, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ABVariant {
  id: string;
  url: string;
  weight: number;
  name: string;
}

interface ABTestingConfigProps {
  variants: ABVariant[];
  onChange: (variants: ABVariant[]) => void;
  disabled?: boolean;
  className?: string;
}

const VARIANT_COLORS = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"];

const VARIANT_NAMES = ["Control", "Variant B", "Variant C", "Variant D"];

export function ABTestingConfig({
  variants,
  onChange,
  disabled = false,
  className,
}: ABTestingConfigProps) {
  const addVariant = () => {
    if (variants.length >= 4) return;

    const newVariant: ABVariant = {
      id: crypto.randomUUID(),
      url: "",
      weight: Math.floor(100 / (variants.length + 1)),
      name: VARIANT_NAMES[variants.length] || `Variant ${variants.length + 1}`,
    };

    // Redistribute weights
    const newWeight = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map((v) => ({
      ...v,
      weight: newWeight,
    }));

    onChange([...updatedVariants, { ...newVariant, weight: newWeight }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return;

    const remaining = variants.filter((v) => v.id !== id);
    const newWeight = Math.floor(100 / remaining.length);
    const updatedVariants = remaining.map((v) => ({
      ...v,
      weight: newWeight,
    }));

    onChange(updatedVariants);
  };

  const updateVariant = (id: string, updates: Partial<ABVariant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const updateWeight = (id: string, newWeight: number) => {
    // Find the variant and calculate the delta
    const variant = variants.find((v) => v.id === id);
    if (!variant) return;

    const delta = newWeight - variant.weight;
    const otherVariants = variants.filter((v) => v.id !== id);
    const totalOtherWeight = otherVariants.reduce((sum, v) => sum + v.weight, 0);

    // Distribute the delta among other variants proportionally
    const updatedVariants = variants.map((v) => {
      if (v.id === id) {
        return { ...v, weight: newWeight };
      }
      const proportion =
        totalOtherWeight > 0 ? v.weight / totalOtherWeight : 1 / otherVariants.length;
      return { ...v, weight: Math.max(10, Math.round(v.weight - delta * proportion)) };
    });

    // Normalize to ensure sum is 100
    const total = updatedVariants.reduce((sum, v) => sum + v.weight, 0);
    if (total !== 100) {
      const diff = 100 - total;
      const lastOther = updatedVariants.find((v) => v.id !== id);
      if (lastOther) {
        lastOther.weight += diff;
      }
    }

    onChange(updatedVariants);
  };

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">A/B Test Variants</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          disabled={disabled || variants.length >= 4}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {/* Traffic distribution bar */}
      <div className="space-y-2">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className={cn(
                "transition-all duration-200",
                VARIANT_COLORS[index % VARIANT_COLORS.length]
              )}
              style={{ width: `${variant.weight}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {variants.map((variant, index) => (
            <span key={variant.id} className="flex items-center gap-1">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  VARIANT_COLORS[index % VARIANT_COLORS.length]
                )}
              />
              {variant.name}: {variant.weight}%
            </span>
          ))}
        </div>
      </div>

      {/* Variant inputs */}
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={variant.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div
              className={cn(
                "h-8 w-1 rounded-full shrink-0",
                VARIANT_COLORS[index % VARIANT_COLORS.length]
              )}
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={variant.name}
                  onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                  className="h-8 w-32 text-sm font-medium"
                  disabled={disabled}
                  placeholder="Variant name"
                />
                <Badge variant="secondary" className="text-xs">
                  {variant.weight}%
                </Badge>
              </div>
              <Input
                value={variant.url}
                onChange={(e) => updateVariant(variant.id, { url: e.target.value })}
                placeholder="https://example.com/variant-page"
                disabled={disabled}
                className="h-9"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">10%</span>
                <Slider
                  value={[variant.weight]}
                  onValueChange={([value]) => updateWeight(variant.id, value)}
                  min={10}
                  max={90}
                  step={5}
                  disabled={disabled || variants.length === 2}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">90%</span>
              </div>
            </div>
            {variants.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVariant(variant.id)}
                disabled={disabled}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Validation warning */}
      {totalWeight !== 100 && (
        <p className="text-sm text-amber-500">
          Weights must sum to 100% (currently {totalWeight}%)
        </p>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Traffic will be split between variants based on weights. Minimum 10% per variant.
      </p>
    </div>
  );
}

/**
 * Locked state for A/B testing (shown to Free/Pro users)
 */
export function ABTestingLocked() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">A/B Testing</CardTitle>
          </div>
          <Badge variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Business
          </Badge>
        </div>
        <CardDescription>Test different destination URLs to optimize conversions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Upgrade to unlock A/B testing</p>
            <p className="text-xs text-muted-foreground">
              Split traffic between variants and find the winner
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Test up to 4 URL variants
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Automatic traffic distribution
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Conversion tracking per variant
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Auto-select winning variant
          </li>
        </ul>

        <Button asChild className="w-full">
          <Link href="/dashboard/billing">Upgrade to Business</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Create initial A/B test variants
 */
export function createInitialVariants(controlUrl: string): ABVariant[] {
  return [
    {
      id: crypto.randomUUID(),
      url: controlUrl,
      weight: 50,
      name: "Control",
    },
    {
      id: crypto.randomUUID(),
      url: "",
      weight: 50,
      name: "Variant B",
    },
  ];
}

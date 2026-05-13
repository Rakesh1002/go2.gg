"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AreaChart, BarChart3, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartViewType = "area" | "bar" | "line";

interface ChartViewSwitcherProps {
  value: ChartViewType;
  onChange: (value: ChartViewType) => void;
  className?: string;
}

const chartViews = [
  { value: "area" as const, icon: AreaChart, label: "Area" },
  { value: "bar" as const, icon: BarChart3, label: "Bar" },
  { value: "line" as const, icon: LineChart, label: "Line" },
];

/**
 * Toggle between different chart visualization types.
 *
 * Supports:
 * - Area chart (filled)
 * - Bar chart
 * - Line chart
 */
export function ChartViewSwitcher({ value, onChange, className }: ChartViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ChartViewType)}
      className={cn("h-8", className)}
    >
      {chartViews.map(({ value: viewValue, icon: Icon, label }) => (
        <ToggleGroupItem
          key={viewValue}
          value={viewValue}
          aria-label={`${label} chart`}
          className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Icon className="h-4 w-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Hook to persist chart view preference in localStorage
 */
export function useChartViewPreference(key: string, defaultValue: ChartViewType = "area") {
  const getStoredValue = (): ChartViewType => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    if (stored && ["area", "bar", "line"].includes(stored)) {
      return stored as ChartViewType;
    }
    return defaultValue;
  };

  const setStoredValue = (value: ChartViewType) => {
    localStorage.setItem(key, value);
  };

  return { getStoredValue, setStoredValue };
}

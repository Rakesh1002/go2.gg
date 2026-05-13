"use client";

import * as React from "react";

export type DateRangePreset =
  | "today"
  | "last-24h"
  | "this-week"
  | "last-7d"
  | "this-month"
  | "last-30d"
  | "last-90d"
  | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function presetToRange(preset: DateRangePreset): { start: Date; end: Date } | null {
  const now = new Date();
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: now };
    case "last-24h":
      return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
    case "this-week":
      return { start: startOfWeek(now), end: now };
    case "last-7d":
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
    case "this-month":
      return { start: startOfMonth(now), end: now };
    case "last-30d":
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    case "last-90d":
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
    case "custom":
      return null;
  }
}

interface DateRangeContextValue {
  range: DateRange;
  setPreset: (preset: DateRangePreset) => void;
  setCustom: (start: Date, end: Date) => void;
  /** Period string for legacy APIs that take "7d" / "30d" / "90d" */
  legacyPeriod: "7d" | "30d" | "90d";
}

const DateRangeContext = React.createContext<DateRangeContextValue | null>(null);

const DEFAULT_PRESET: DateRangePreset = "last-30d";

export function DateRangeProvider({
  children,
  defaultPreset = DEFAULT_PRESET,
}: {
  children: React.ReactNode;
  defaultPreset?: DateRangePreset;
}) {
  const [range, setRange] = React.useState<DateRange>(() => {
    const r = presetToRange(defaultPreset)!;
    return { ...r, preset: defaultPreset };
  });

  const setPreset = React.useCallback((preset: DateRangePreset) => {
    const r = presetToRange(preset);
    if (r) setRange({ ...r, preset });
  }, []);

  const setCustom = React.useCallback((start: Date, end: Date) => {
    setRange({ start, end, preset: "custom" });
  }, []);

  const legacyPeriod = React.useMemo<"7d" | "30d" | "90d">(() => {
    const days = (range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 7) return "7d";
    if (days <= 30) return "30d";
    return "90d";
  }, [range]);

  const value = React.useMemo(
    () => ({ range, setPreset, setCustom, legacyPeriod }),
    [range, setPreset, setCustom, legacyPeriod],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = React.useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used inside DateRangeProvider");
  return ctx;
}

"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  type DateRangePreset,
  presetToRange,
  useDateRange,
} from "@/contexts/date-range-context";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  "last-24h": "Last 24 hours",
  "this-week": "This week",
  "last-7d": "Last 7 days",
  "this-month": "This month",
  "last-30d": "Last 30 days",
  "last-90d": "Last 90 days",
  custom: "Custom",
};

function formatShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DateRangePicker({ className }: { className?: string }) {
  const { range, setPreset, setCustom } = useDateRange();
  const [customOpen, setCustomOpen] = React.useState(false);

  function handleChange(value: string) {
    const preset = value as DateRangePreset;
    if (preset === "custom") {
      setCustomOpen(true);
      return;
    }
    if (presetToRange(preset)) setPreset(preset);
  }

  const showLabel = range.preset !== "custom";

  return (
    <>
      <Select value={range.preset} onValueChange={handleChange}>
        <SelectTrigger className={className ?? "w-[180px]"}>
          {showLabel ? (
            <SelectValue />
          ) : (
            <span className="text-sm">
              {formatShort(range.start)} – {formatShort(range.end)}
            </span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">{PRESET_LABELS.today}</SelectItem>
          <SelectItem value="last-24h">{PRESET_LABELS["last-24h"]}</SelectItem>
          <SelectSeparator />
          <SelectItem value="this-week">{PRESET_LABELS["this-week"]}</SelectItem>
          <SelectItem value="last-7d">{PRESET_LABELS["last-7d"]}</SelectItem>
          <SelectSeparator />
          <SelectItem value="this-month">{PRESET_LABELS["this-month"]}</SelectItem>
          <SelectItem value="last-30d">{PRESET_LABELS["last-30d"]}</SelectItem>
          <SelectSeparator />
          <SelectItem value="last-90d">{PRESET_LABELS["last-90d"]}</SelectItem>
          <SelectSeparator />
          <SelectItem value="custom">{PRESET_LABELS.custom}</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="w-auto max-w-[95svw] md:max-w-screen-md">
          <DialogHeader>
            <DialogTitle>Custom date range</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="range">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="date">Single date</TabsTrigger>
                <TabsTrigger value="range">Date range</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="date" className="overflow-y-auto">
              <Calendar
                mode="single"
                disabled={(d) => d > new Date()}
                onSelect={(d) => {
                  if (!d) return;
                  const start = new Date(d);
                  start.setHours(0, 0, 0, 0);
                  const end = new Date(d);
                  end.setHours(23, 59, 59, 999);
                  setCustom(start, end);
                  setCustomOpen(false);
                }}
              />
            </TabsContent>
            <TabsContent value="range" className="overflow-y-auto">
              <Calendar
                mode="range"
                numberOfMonths={2}
                disabled={(d) => d > new Date()}
                onSelect={(r) => {
                  if (r?.from && r?.to) {
                    const start = new Date(r.from);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(r.to);
                    end.setHours(23, 59, 59, 999);
                    setCustom(start, end);
                    setCustomOpen(false);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

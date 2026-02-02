"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown } from "lucide-react";

export interface DateRangePreset {
  id: string;
  label: string;
  getValue: () => DateRange;
}

const defaultPresets: DateRangePreset[] = [
  {
    id: "today",
    label: "Today",
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    id: "yesterday",
    label: "Yesterday",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    id: "last7",
    label: "Last 7 days",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    id: "last14",
    label: "Last 14 days",
    getValue: () => ({
      from: subDays(new Date(), 13),
      to: new Date(),
    }),
  },
  {
    id: "last30",
    label: "Last 30 days",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    id: "last90",
    label: "Last 90 days",
    getValue: () => ({
      from: subDays(new Date(), 89),
      to: new Date(),
    }),
  },
  {
    id: "thisMonth",
    label: "This month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    id: "lastMonth",
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
];

interface DateRangePickerProps {
  /** Currently selected date range */
  value?: DateRange;
  /** Callback when range changes */
  onChange?: (range: DateRange | undefined) => void;
  /** Available presets */
  presets?: DateRangePreset[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Align popover */
  align?: "start" | "center" | "end";
  /** Show presets panel */
  showPresets?: boolean;
  /** Number of calendars to show */
  numberOfMonths?: number;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  placeholder = "Select date range",
  disabled = false,
  align = "start",
  showPresets = true,
  numberOfMonths = 2,
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);

  // Find if current value matches a preset
  React.useEffect(() => {
    if (!value?.from || !value?.to) {
      setSelectedPreset(null);
      return;
    }

    for (const preset of presets) {
      const presetValue = preset.getValue();
      if (
        presetValue.from &&
        presetValue.to &&
        value.from.toDateString() === presetValue.from.toDateString() &&
        value.to.toDateString() === presetValue.to.toDateString()
      ) {
        setSelectedPreset(preset.id);
        return;
      }
    }
    setSelectedPreset(null);
  }, [value, presets]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    const range = preset.getValue();
    onChange?.(range);
    setSelectedPreset(preset.id);
    setOpen(false);
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;

    if (selectedPreset) {
      const preset = presets.find((p) => p.id === selectedPreset);
      if (preset) return preset.label;
    }

    if (value.to) {
      return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`;
    }

    return format(value.from, "MMM d, yyyy");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            !value?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="flex-1">{formatDateRange()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} sideOffset={8}>
        <div className="flex">
          {/* Presets panel */}
          {showPresets && (
            <div className="border-r p-2 space-y-1 w-40">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={numberOfMonths}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange?.(undefined);
              setSelectedPreset(null);
            }}
          >
            Clear
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SimpleDatePickerProps {
  /** Currently selected date */
  value?: Date;
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  className?: string;
}

export function SimpleDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
  className,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="flex-1">{value ? format(value, "MMM d, yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { defaultPresets };

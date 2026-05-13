"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

interface AnimatedStatProps {
  value: number;
  /** NumberFlow's narrower subset of Intl.NumberFormatOptions. */
  format?: Format;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Apply a blur+dim style while value is zero (initial-load polish from sink) */
  blurWhenEmpty?: boolean;
}

const safe = (v: number) => (Number.isFinite(v) ? v : 0);

export function AnimatedStat({
  value,
  format,
  prefix,
  suffix,
  className,
  blurWhenEmpty = true,
}: AnimatedStatProps) {
  const v = safe(value);
  const isEmpty = blurWhenEmpty && v === 0;

  return (
    <NumberFlow
      value={v}
      format={format}
      prefix={prefix}
      suffix={suffix}
      className={cn(
        "tabular-nums transition-[filter,opacity] duration-300",
        isEmpty && "opacity-60 blur-sm",
        className,
      )}
    />
  );
}

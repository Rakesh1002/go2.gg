"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The target value to count to */
  value: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function */
  easing?: "linear" | "easeOut" | "easeInOut";
  /** Format the number (e.g., add commas, abbreviate) */
  formatFn?: (value: number) => string;
  /** Number of decimal places to show */
  decimals?: number;
  /** Prefix to add before the number */
  prefix?: string;
  /** Suffix to add after the number */
  suffix?: string;
  /** Delay before animation starts in ms */
  delay?: number;
  /** Animate on mount or when value changes */
  animateOnChange?: boolean;
}

const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

function defaultFormat(value: number, decimals: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AnimatedCounter({
  value,
  duration = 1500,
  easing = "easeOut",
  formatFn,
  decimals = 0,
  prefix = "",
  suffix = "",
  delay = 0,
  animateOnChange = true,
  className,
  ...props
}: AnimatedCounterProps) {
  // Guard against NaN, undefined, null, or Infinity
  const safeValue = Number.isFinite(value) ? value : 0;

  const [displayValue, setDisplayValue] = React.useState(animateOnChange ? 0 : safeValue);
  const previousValue = React.useRef(animateOnChange ? 0 : safeValue);
  const animationRef = React.useRef<number | undefined>(undefined);
  const startTimeRef = React.useRef<number | undefined>(undefined);
  const hasAnimated = React.useRef(false);

  const format = formatFn || ((v: number) => defaultFormat(Number.isFinite(v) ? v : 0, decimals));

  React.useEffect(() => {
    // Skip if reduced motion is preferred
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(safeValue);
      return;
    }

    // Don't re-animate if value hasn't changed and we've already animated
    if (!animateOnChange && hasAnimated.current) {
      setDisplayValue(safeValue);
      return;
    }

    const startValue = previousValue.current;
    const targetValue = safeValue;
    const easingFn = easingFunctions[easing];

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay;
      }

      const elapsed = timestamp - startTimeRef.current;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = startValue + (targetValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
        previousValue.current = targetValue;
      }
    };

    startTimeRef.current = undefined;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safeValue, duration, easing, delay, animateOnChange]);

  // Update previous value when value prop changes
  React.useEffect(() => {
    if (animateOnChange) {
      previousValue.current = displayValue;
    }
  }, [safeValue, animateOnChange, displayValue]);

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {prefix}
      {format(displayValue)}
      {suffix}
    </span>
  );
}

/** Shorthand for common number formats */
export function AnimatedNumber({
  value,
  ...props
}: Omit<AnimatedCounterProps, "formatFn"> & { abbreviated?: boolean }) {
  const formatFn = props.abbreviated
    ? (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toLocaleString();
      }
    : undefined;

  return <AnimatedCounter value={value} formatFn={formatFn} {...props} />;
}

/** Animated percentage display */
export function AnimatedPercentage({
  value,
  showSign = false,
  ...props
}: Omit<AnimatedCounterProps, "formatFn" | "suffix"> & { showSign?: boolean }) {
  const sign = showSign && value > 0 ? "+" : "";
  return <AnimatedCounter value={value} decimals={1} prefix={sign} suffix="%" {...props} />;
}

/** Animated currency display */
export function AnimatedCurrency({
  value,
  currency = "USD",
  locale = "en-US",
  ...props
}: Omit<AnimatedCounterProps, "formatFn" | "prefix"> & {
  currency?: string;
  locale?: string;
}) {
  const formatFn = React.useCallback(
    (n: number) => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(n);
    },
    [currency, locale]
  );

  return <AnimatedCounter value={value} formatFn={formatFn} {...props} />;
}

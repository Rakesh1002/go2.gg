"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

const sizes = {
  sm: {
    icon: "h-7 w-7",
    iconInner: "h-3.5 w-3.5",
    text: "text-lg",
  },
  md: {
    icon: "h-9 w-9",
    iconInner: "h-4 w-4",
    text: "text-xl",
  },
  lg: {
    icon: "h-12 w-12",
    iconInner: "h-6 w-6",
    text: "text-2xl",
  },
};

export function Logo({ showText = true, size = "md", className, href = "/" }: LogoProps) {
  const s = sizes[size];

  const content = (
    <span className={cn("flex items-center gap-2.5 group", className)}>
      {/* Icon matching favicon - Warm coral gradient */}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.70_0.16_45)] text-white shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/25 group-hover:scale-105",
          s.icon
        )}
      >
        <ArrowUpRight
          className={cn(
            "transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            s.iconInner
          )}
          strokeWidth={3}
        />
        {/* Glow effect */}
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {/* Text */}
      {showText && (
        <span className={cn("font-bold tracking-tight", s.text)}>
          <span className="text-foreground">Go2</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}

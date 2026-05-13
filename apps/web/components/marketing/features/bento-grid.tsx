"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
  href,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  href?: string;
}) => {
  const Content = (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 shadow-input transition duration-200 hover:shadow-xl",
        className,
      )}
    >
      <div className="relative flex h-full min-h-24 w-full flex-1 overflow-hidden rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
        {header}
      </div>
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        <div className="mb-2 flex items-center gap-2 text-[var(--marketing-accent)]">
          {icon}
          {href && (
            <ArrowRight className="-translate-x-2 h-4 w-4 opacity-0 transition-all duration-200 group-hover/bento:translate-x-0 group-hover/bento:opacity-100" />
          )}
        </div>
        <div className="mt-2 mb-2 font-bold text-[var(--marketing-text)]">
          {title}
        </div>
        <div className="font-normal text-[var(--marketing-text-muted)] text-xs">
          {description}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "row-span-1 block h-full",
          className?.includes("col-span") ? className : "",
        )}
      >
        {Content}
      </Link>
    );
  }

  return Content;
};

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
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
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
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input p-4 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] justify-between flex flex-col space-y-4",
        className,
      )}
    >
      <div className="flex flex-1 w-full h-full min-h-24 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)] overflow-hidden relative">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="flex items-center gap-2 mb-2 text-[var(--marketing-accent)]">
          {icon}
          {href && (
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/bento:opacity-100 group-hover/bento:translate-x-0 transition-all duration-200" />
          )}
        </div>
        <div className="font-bold text-[var(--marketing-text)] mb-2 mt-2">
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
          className && className.includes("col-span") ? className : "",
        )}
      >
        {Content}
      </Link>
    );
  }

  return Content;
};

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock } from "lucide-react";

interface AuthorCardProps {
  author: string;
  authorImage?: string;
  authorBio?: string;
  date: string;
  readingTime: string;
  className?: string;
  variant?: "inline" | "card";
}

/**
 * Author card component for blog posts
 */
export function AuthorCard({
  author,
  authorImage,
  authorBio,
  date,
  readingTime,
  className,
  variant = "inline",
}: AuthorCardProps) {
  const initials = author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex items-start gap-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6",
          className
        )}
      >
        <Avatar className="h-14 w-14 border-2 border-[var(--marketing-accent)]/20">
          <AvatarImage src={authorImage} alt={author} />
          <AvatarFallback className="bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-[var(--marketing-text)]">{author}</p>
          {authorBio && (
            <p className="mt-1 text-sm text-[var(--marketing-text-muted)] line-clamp-2">
              {authorBio}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-[var(--marketing-text-muted)]">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readingTime}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Avatar className="h-10 w-10 border border-[var(--marketing-border)]">
        <AvatarImage src={authorImage} alt={author} />
        <AvatarFallback className="bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <p className="font-medium text-[var(--marketing-text)]">{author}</p>
        <div className="flex items-center gap-3 text-sm text-[var(--marketing-text-muted)]">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
          <span className="text-[var(--marketing-border)]">·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readingTime}
          </div>
        </div>
      </div>
    </div>
  );
}

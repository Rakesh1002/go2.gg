import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/generated/blog";

interface FeaturedPostProps {
  post: BlogPost;
  className?: string;
}

/**
 * Featured/hero post card for blog list page
 */
export function FeaturedPost({ post, className }: FeaturedPostProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative grid gap-6 overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-lg md:grid-cols-2",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[var(--marketing-accent)]/20 to-[var(--marketing-accent)]/5 md:aspect-auto">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-bold text-8xl text-[var(--marketing-accent)]/20">
              {post.title.charAt(0)}
            </div>
          </div>
        )}

        {/* Featured badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent)]">
            Featured
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8 lg:p-10">
        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border-none bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] text-xs hover:bg-[var(--marketing-accent)]/20 sm:text-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h2 className="mb-3 font-bold text-[var(--marketing-text)] text-xl transition-colors group-hover:text-[var(--marketing-accent)] sm:mb-4 sm:text-2xl md:text-3xl">
          {post.title}
        </h2>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-[var(--marketing-text-muted)] text-sm leading-relaxed sm:mb-6 sm:line-clamp-3 sm:text-base">
          {post.description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex flex-col gap-3 border-[var(--marketing-border)] border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <div className="flex items-center gap-3 text-[var(--marketing-text-muted)] text-xs sm:gap-4 sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {post.readingTime}
            </div>
          </div>

          <span className="sm:-translate-x-2 flex items-center gap-1 font-medium text-[var(--marketing-accent)] text-xs transition-all sm:text-sm sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
            Read article
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

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
        "group relative grid gap-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] overflow-hidden transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-lg md:grid-cols-2",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-[16/9] md:aspect-auto relative bg-gradient-to-br from-[var(--marketing-accent)]/20 to-[var(--marketing-accent)]/5 overflow-hidden">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl font-bold text-[var(--marketing-accent)]/20">
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
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] hover:bg-[var(--marketing-accent)]/20 border-none text-xs sm:text-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors mb-3 sm:mb-4">
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-[var(--marketing-text-muted)] leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto pt-4 sm:pt-6 border-t border-[var(--marketing-border)]">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--marketing-text-muted)]">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {post.readingTime}
            </div>
          </div>

          <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[var(--marketing-accent)] sm:opacity-0 sm:-translate-x-2 transition-all sm:group-hover:opacity-100 sm:group-hover:translate-x-0">
            Read article
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/generated/blog";

interface RelatedPostsProps {
  posts: BlogPost[];
  className?: string;
}

/**
 * Related posts section for blog post footer
 */
export function RelatedPosts({ posts, className }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className={cn("mt-10 sm:mt-16", className)}>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--marketing-text)] mb-6 sm:mb-8">
        Related Articles
      </h2>
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] overflow-hidden transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-md"
          >
            {/* Image placeholder */}
            {post.image && (
              <div className="aspect-[16/9] bg-gradient-to-br from-[var(--marketing-accent)]/10 to-[var(--marketing-accent)]/5 relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}

            <div className="flex flex-col flex-1 p-5">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] hover:bg-[var(--marketing-accent)]/20 border-none text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors line-clamp-2 mb-2">
                {post.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[var(--marketing-text-muted)] line-clamp-2 flex-1">
                {post.description}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--marketing-border)]">
                <div className="flex items-center gap-3 text-xs text-[var(--marketing-text-muted)]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--marketing-accent)] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

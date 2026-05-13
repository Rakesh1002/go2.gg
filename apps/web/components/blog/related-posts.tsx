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
      <h2 className="mb-6 font-bold text-[var(--marketing-text)] text-xl sm:mb-8 sm:text-2xl">
        Related Articles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-md"
          >
            {/* Image placeholder */}
            {post.image && (
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[var(--marketing-accent)]/10 to-[var(--marketing-accent)]/5">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col p-5">
              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-none bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] text-xs hover:bg-[var(--marketing-accent)]/20"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h3 className="mb-2 line-clamp-2 font-semibold text-[var(--marketing-text)] transition-colors group-hover:text-[var(--marketing-accent)]">
                {post.title}
              </h3>

              {/* Description */}
              <p className="line-clamp-2 flex-1 text-[var(--marketing-text-muted)] text-sm">
                {post.description}
              </p>

              {/* Meta */}
              <div className="mt-4 flex items-center justify-between border-[var(--marketing-border)] border-t pt-4">
                <div className="flex items-center gap-3 text-[var(--marketing-text-muted)] text-xs">
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
                <ArrowRight className="-translate-x-2 h-4 w-4 text-[var(--marketing-accent)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

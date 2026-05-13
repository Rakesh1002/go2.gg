"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { TagFilter } from "./tag-filter";
import { FeaturedPost } from "./featured-post";
import { NewsletterSignup } from "./newsletter-signup";
import type { BlogPost } from "@/lib/generated/blog";

interface BlogListProps {
  posts: BlogPost[];
  tags: string[];
}

/**
 * Blog post card component
 */
function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group hover:-translate-y-1 flex flex-col gap-6 overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-sm transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-md md:flex-row"
    >
      {/* Image */}
      {post.image && (
        <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-gradient-to-br from-[var(--marketing-accent)]/10 to-[var(--marketing-accent)]/5 md:aspect-auto md:w-72 lg:w-80">
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-6 md:py-6 md:pr-6 md:pl-0">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.slice(0, 3).map((tag) => (
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
        <h2 className="font-bold text-[var(--marketing-text)] text-xl transition-colors group-hover:text-[var(--marketing-accent)] lg:text-2xl">
          {post.title}
        </h2>

        {/* Description */}
        <p className="line-clamp-2 text-[var(--marketing-text-muted)] leading-relaxed">
          {post.description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center justify-between border-[var(--marketing-border)] border-t pt-4">
          <div className="flex items-center gap-4 text-[var(--marketing-text-muted)] text-sm">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </div>
          </div>

          <span className="-translate-x-2 flex items-center gap-1 font-medium text-[var(--marketing-accent)] text-sm opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
            Read
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Blog list with filtering
 */
export function BlogList({ posts, tags }: BlogListProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter posts by selected tag
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((post) => post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  // Get featured post (first/latest post when no filter)
  const featuredPost = selectedTag === null ? posts[0] : null;
  const remainingPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  if (posts.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-12 text-center">
        <p className="text-[var(--marketing-text-muted)] text-lg">
          No blog posts yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Tag Filter */}
      {tags.length > 0 && (
        <TagFilter
          tags={tags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
          className="justify-center"
        />
      )}

      {/* Featured Post */}
      {featuredPost && <FeaturedPost post={featuredPost} />}

      {/* Posts Grid */}
      {remainingPosts.length > 0 && (
        <div className="grid gap-6">
          {remainingPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {/* No results */}
      {filteredPosts.length === 0 && selectedTag && (
        <div className="py-12 text-center">
          <p className="text-[var(--marketing-text-muted)]">
            No posts found with tag &quot;{selectedTag}&quot;
          </p>
        </div>
      )}

      {/* Newsletter */}
      <NewsletterSignup className="mt-16" />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMetadata, siteConfig } from "@repo/config";
// Use pre-generated content (no runtime fs calls)
import { getBlogPost, getAllBlogPosts, getRelatedPosts } from "@/lib/generated/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import {
  ReadingProgress,
  StickyTableOfContents,
  ShareButtons,
  AuthorCard,
  RelatedPosts,
  NewsletterSignup,
} from "@/components/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return getMetadata({ title: "Post Not Found" });
  }

  return getMetadata({
    title: post.title,
    description: post.description,
    ...(post.image ? { image: post.image } : {}),
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const postUrl = `${siteConfig.url}/blog/${post.slug}`;

  // Format date
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgress />

      <article className="bg-[var(--marketing-bg)]">
        {/* Hero Section with Full-Width Image */}
        <div className="relative">
          {/* Back button — sits below the fixed navbar so they don't collide on mobile */}
          <div className="absolute top-20 left-4 z-20">
            <Link href="/blog">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to blog
              </Button>
            </Link>
          </div>

          {/* Hero Image — min-height + content in normal flow so it grows on mobile
              instead of clipping the title behind the navbar */}
          {post.image ? (
            <div className="relative w-full overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Gradient overlay — darker top so navbar stays legible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/55" />

              {/* Content — normal flow, justify-end pushes to bottom; pt-32 reserves
                  navbar + back-button clearance, min-h sets the floor */}
              <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pt-32 pb-12 sm:px-6 md:min-h-[60vh] md:pt-36 md:pb-16 lg:min-h-[70vh] lg:px-8 lg:pt-40 lg:pb-20">
                <div className="mx-auto max-w-4xl text-center">
                  {/* Tags */}
                  <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="border-none bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title — smaller on mobile to fit two-line titles */}
                  <h1 className="break-words font-bold text-2xl text-white leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                    {post.title}
                  </h1>

                  {/* Description */}
                  <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 leading-relaxed sm:text-lg md:text-xl">
                    {post.description}
                  </p>

                  {/* Meta Info — gap-4 on mobile so it doesn't wrap into a tower */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/80 sm:text-base">
                    <div className="flex items-center gap-2">
                      {post.authorImage ? (
                        <img
                          src={post.authorImage}
                          alt={post.author}
                          className="h-10 w-10 rounded-full border-2 border-white/30"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <span className="font-medium">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback without image */
            <div className="bg-gradient-to-br from-[var(--marketing-accent)]/20 via-[var(--marketing-bg)] to-[var(--marketing-accent)]/10 pt-20 pb-16">
              <div className="mx-auto max-w-7xl px-4">
                <div className="mx-auto max-w-4xl text-center">
                  {/* Tags */}
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="border-none bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] hover:bg-[var(--marketing-accent)]/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="font-bold text-3xl text-[var(--marketing-text)] leading-tight tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">
                    {post.title}
                  </h1>

                  {/* Description */}
                  <p className="mx-auto mt-6 max-w-2xl text-[var(--marketing-text-muted)] text-lg leading-relaxed md:text-xl">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[var(--marketing-text-muted)]">
                    <div className="flex items-center gap-2">
                      {post.authorImage ? (
                        <img
                          src={post.authorImage}
                          alt={post.author}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                          <User className="h-5 w-5 text-[var(--marketing-accent)]" />
                        </div>
                      )}
                      <span className="font-medium text-[var(--marketing-text)]">
                        {post.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
            {/* Article Content */}
            <div className="min-w-0">
              {/* Mobile TOC */}
              {post.headings.length > 0 && (
                <div className="mb-8 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 lg:hidden">
                  <StickyTableOfContents items={post.headings} />
                </div>
              )}

              {/* Blog Content */}
              <div
                className="blog-prose prose prose-gray dark:prose-invert prose-lg max-w-none prose-table:border-collapse prose-code:rounded prose-img:rounded-xl prose-pre:border prose-td:border prose-th:border prose-pre:border-[var(--marketing-border)] prose-td:border-[var(--marketing-border)] prose-th:border-[var(--marketing-border)] prose-blockquote:border-l-[var(--marketing-accent)] prose-code:bg-[var(--marketing-bg-elevated)] prose-pre:bg-[var(--marketing-bg-elevated)] prose-th:bg-[var(--marketing-bg-elevated)] prose-td:p-3 prose-th:p-3 prose-code:px-1.5 prose-code:py-0.5 prose-th:text-left prose-headings:font-bold prose-strong:font-semibold prose-a:text-[var(--marketing-accent)] prose-blockquote:text-[var(--marketing-text-muted)] prose-code:text-sm prose-headings:text-[var(--marketing-text)] prose-li:text-[var(--marketing-text-muted)] prose-p:text-[var(--marketing-text-muted)] prose-strong:text-[var(--marketing-text)] prose-p:leading-relaxed prose-headings:tracking-tight prose-a:no-underline prose-img:shadow-lg hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />

              {/* Article Footer */}
              <footer className="mt-16 border-[var(--marketing-border)] border-t pt-8">
                {/* Share & Navigation */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <Link href="/blog">
                    <Button
                      variant="outline"
                      className="gap-2 border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      All posts
                    </Button>
                  </Link>

                  <ShareButtons url={postUrl} title={post.title} description={post.description} />
                </div>

                {/* Author Card - Full */}
                <div className="mt-12">
                  <AuthorCard
                    author={post.author}
                    authorImage={post.authorImage}
                    authorBio={post.authorBio}
                    date={post.date}
                    readingTime={post.readingTime}
                    variant="card"
                  />
                </div>
              </footer>

              {/* Related Posts */}
              <RelatedPosts posts={relatedPosts} />

              {/* Newsletter */}
              <div className="mt-16">
                <NewsletterSignup />
              </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                {/* Table of Contents */}
                {post.headings.length > 0 && (
                  <div className="mb-8 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
                    <StickyTableOfContents items={post.headings} />
                  </div>
                )}

                {/* Share Buttons */}
                <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
                  <p className="mb-3 font-semibold text-[var(--marketing-text)] text-sm">
                    Share this article
                  </p>
                  <ShareButtons url={postUrl} title={post.title} description={post.description} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

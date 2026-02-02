import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
          {/* Back button - Floating */}
          <div className="absolute top-4 left-4 z-20">
            <Link href="/blog">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 bg-black/30 backdrop-blur-md text-white hover:bg-black/50 hover:text-white border border-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to blog
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          {post.image ? (
            <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] w-full overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="max-w-7xl mx-auto px-4 pb-12 md:pb-16 lg:pb-20">
                  <div className="max-w-4xl mx-auto text-center">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                      {post.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-tight">
                      {post.title}
                    </h1>

                    {/* Description */}
                    <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                      {post.description}
                    </p>

                    {/* Meta Info */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/80">
                      <div className="flex items-center gap-2">
                        {post.authorImage ? (
                          <img
                            src={post.authorImage}
                            alt={post.author}
                            className="w-10 h-10 rounded-full border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <span className="font-medium">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{post.readingTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback without image */
            <div className="bg-gradient-to-br from-[var(--marketing-accent)]/20 via-[var(--marketing-bg)] to-[var(--marketing-accent)]/10 pt-20 pb-16">
              <div className="max-w-7xl mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] hover:bg-[var(--marketing-accent)]/20 border-none"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[var(--marketing-text)] leading-tight">
                    {post.title}
                  </h1>

                  {/* Description */}
                  <p className="mt-6 text-lg md:text-xl text-[var(--marketing-text-muted)] max-w-2xl mx-auto leading-relaxed">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[var(--marketing-text-muted)]">
                    <div className="flex items-center gap-2">
                      {post.authorImage ? (
                        <img
                          src={post.authorImage}
                          alt={post.author}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--marketing-accent)]/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-[var(--marketing-accent)]" />
                        </div>
                      )}
                      <span className="font-medium text-[var(--marketing-text)]">
                        {post.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 max-w-6xl mx-auto">
            {/* Article Content */}
            <div className="min-w-0">
              {/* Mobile TOC */}
              {post.headings.length > 0 && (
                <div className="lg:hidden mb-8 p-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                  <StickyTableOfContents items={post.headings} />
                </div>
              )}

              {/* Blog Content */}
              <div
                className="blog-prose prose prose-gray dark:prose-invert prose-lg max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--marketing-text)]
                  prose-p:text-[var(--marketing-text-muted)] prose-p:leading-relaxed
                  prose-a:text-[var(--marketing-accent)] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-[var(--marketing-text)] prose-strong:font-semibold
                  prose-code:bg-[var(--marketing-bg-elevated)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-[var(--marketing-bg-elevated)] prose-pre:border prose-pre:border-[var(--marketing-border)]
                  prose-blockquote:border-l-[var(--marketing-accent)] prose-blockquote:text-[var(--marketing-text-muted)]
                  prose-li:text-[var(--marketing-text-muted)]
                  prose-table:border-collapse
                  prose-th:bg-[var(--marketing-bg-elevated)] prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-[var(--marketing-border)]
                  prose-td:p-3 prose-td:border prose-td:border-[var(--marketing-border)]
                  prose-img:rounded-xl prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />

              {/* Article Footer */}
              <footer className="mt-16 pt-8 border-t border-[var(--marketing-border)]">
                {/* Share & Navigation */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Link href="/blog">
                    <Button
                      variant="outline"
                      className="gap-2 border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)] bg-transparent"
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
                  <div className="mb-8 p-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                    <StickyTableOfContents items={post.headings} />
                  </div>
                )}

                {/* Share Buttons */}
                <div className="p-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                  <p className="text-sm font-semibold text-[var(--marketing-text)] mb-3">
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

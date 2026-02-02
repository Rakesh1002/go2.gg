import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { getAllBlogPosts, getAllTags } from "@/lib/generated/blog";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { BlogList } from "@/components/blog";

export const metadata: Metadata = getMetadata({
  title: "Blog",
  description: `Latest news, tutorials, and updates from ${siteConfig.name}. Learn about link management, analytics, QR codes, and marketing best practices.`,
});

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const tags = getAllTags();

  return (
    <div className="relative min-h-screen bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-6 animate-fade-in-down">
            The Blog
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Latest{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">updates</span> &
            insights
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Tutorials, engineering deep dives, and product updates from the Go2 team. Learn how to
            build better links.
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="max-w-7xl relative mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <BlogList posts={posts} tags={tags} />
        </div>
      </section>
    </div>
  );
}

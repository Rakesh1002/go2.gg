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
      <section className="relative overflow-hidden pt-20 pb-12 md:pt-28 md:pb-16">
        <GeometricShapes position="hero-right" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            The Blog
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Latest{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">updates</span> &
            insights
          </h1>
          <p className="stagger-1 mx-auto mt-6 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            Tutorials, engineering deep dives, and product updates from the Go2 team. Learn how to
            build better links.
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <BlogList posts={posts} tags={tags} />
        </div>
      </section>
    </div>
  );
}

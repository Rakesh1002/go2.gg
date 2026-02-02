import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMetadata } from "@repo/config";
// Use pre-generated content (no runtime fs calls)
import { getDocPage, getAllDocPages } from "@/lib/generated/docs";
import { extractHeadings } from "@/lib/generated/blog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { CopyMarkdownButton } from "@/components/docs/copy-markdown-button";

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  const docs = getAllDocPages();
  // Include root path for /docs (which defaults to introduction)
  const params = [
    { slug: [] }, // /docs root - empty array for optional catch-all
    ...docs.map((doc) => ({
      slug: doc.slug.split("/"),
    })),
  ];
  return params;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug?.join("/") ?? "introduction";
  const doc = getDocPage(slugPath);

  if (!doc) {
    return getMetadata({ title: "Not Found" });
  }

  return getMetadata({
    title: doc.title,
    description: doc.description,
  });
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const slugPath = slug?.join("/") ?? "introduction";
  const doc = getDocPage(slugPath);

  if (!doc) {
    notFound();
  }

  // Get all docs for navigation
  const allDocs = getAllDocPages();
  const currentIndex = allDocs.findIndex((d) => d.slug === slugPath);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  // Extract headings for TOC
  const headings = extractHeadings(doc.content);

  return (
    <div className="flex gap-12">
      {/* Main content area */}
      <div className="flex-1 min-w-0 max-w-[780px]">
        <article className="py-8 lg:py-10">
          {/* Breadcrumb and actions */}
          <div className="flex items-center justify-between mb-8">
            <DocsBreadcrumb slug={slugPath} title={doc.title} section={doc.section} />
            <CopyMarkdownButton
              slug={slugPath}
              title={doc.title}
              description={doc.description}
              content={doc.content}
            />
          </div>

          {/* Page header */}
          <header className="mb-10">
            <h1 className="text-[2.25rem] font-bold tracking-tight text-foreground leading-tight">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {doc.description}
              </p>
            )}
          </header>

          {/* Content with enhanced styling */}
          <div className="docs-content" dangerouslySetInnerHTML={{ __html: doc.html }} />

          {/* Navigation footer */}
          <footer className="mt-16 pt-8 border-t border-border/60">
            <div className="flex items-stretch gap-4">
              {prevDoc ? (
                <Link href={`/docs/${prevDoc.slug}`} className="flex-1 group">
                  <div className="flex flex-col h-full p-4 rounded-xl border border-border/60 bg-muted/20 transition-all hover:border-[var(--docs-accent)]/40 hover:bg-muted/40">
                    <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                      <ArrowLeft className="h-3 w-3" />
                      Previous
                    </span>
                    <span className="font-semibold text-foreground group-hover:text-[var(--docs-accent)] transition-colors">
                      {prevDoc.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {nextDoc && (
                <Link href={`/docs/${nextDoc.slug}`} className="flex-1 group text-right">
                  <div className="flex flex-col h-full p-4 rounded-xl border border-border/60 bg-muted/20 transition-all hover:border-[var(--docs-accent)]/40 hover:bg-muted/40">
                    <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5 justify-end">
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="font-semibold text-foreground group-hover:text-[var(--docs-accent)] transition-colors">
                      {nextDoc.title}
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </footer>
        </article>
      </div>

      {/* Table of Contents */}
      <TableOfContents headings={headings} />
    </div>
  );
}

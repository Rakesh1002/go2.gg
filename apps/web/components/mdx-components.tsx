import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Zap, AlertTriangle, XCircle, CheckCircle, Info, Lightbulb } from "lucide-react";

/**
 * Generate a slug from text for heading IDs
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract text content from React children
 */
function getTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

/**
 * Custom MDX Components
 *
 * Override default HTML elements with styled versions.
 */
export const mdxComponents: MDXComponents = {
  // Headings with auto-generated IDs for TOC - responsive sizing
  h1: ({ className, children, ...props }) => {
    const text = getTextContent(children);
    const id = generateSlug(text);
    return (
      <h1
        id={id}
        className={cn(
          "mt-6 scroll-m-20 font-bold text-2xl text-[var(--marketing-text)] tracking-tight sm:mt-8 sm:scroll-m-24 sm:text-3xl md:text-4xl",
          className
        )}
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ className, children, ...props }) => {
    const text = getTextContent(children);
    const id = generateSlug(text);
    return (
      <h2
        id={id}
        className={cn(
          "mt-8 scroll-m-20 border-[var(--marketing-border)] border-b pb-2 font-bold text-[var(--marketing-text)] text-xl tracking-tight first:mt-0 sm:mt-10 sm:scroll-m-24 sm:pb-3 sm:text-2xl md:mt-12",
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ className, children, ...props }) => {
    const text = getTextContent(children);
    const id = generateSlug(text);
    return (
      <h3
        id={id}
        className={cn(
          "mt-6 scroll-m-20 font-semibold text-[var(--marketing-text)] text-lg tracking-tight sm:mt-8 sm:scroll-m-24 sm:text-xl md:mt-10",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ className, children, ...props }) => {
    const text = getTextContent(children);
    const id = generateSlug(text);
    return (
      <h4
        id={id}
        className={cn(
          "mt-5 scroll-m-20 font-semibold text-[var(--marketing-text)] text-base tracking-tight sm:mt-6 sm:scroll-m-24 sm:text-lg md:mt-8",
          className
        )}
        {...props}
      >
        {children}
      </h4>
    );
  },

  // Paragraph - responsive leading and spacing
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "text-[var(--marketing-text-muted)] text-sm leading-relaxed sm:text-base sm:leading-7 [&:not(:first-child)]:mt-4 sm:[&:not(:first-child)]:mt-6",
        className
      )}
      {...props}
    />
  ),

  // Lists - responsive spacing
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-4 ml-4 list-disc text-[var(--marketing-text-muted)] sm:my-6 sm:ml-6 [&>li]:mt-2 sm:[&>li]:mt-3",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 ml-4 list-decimal text-[var(--marketing-text-muted)] sm:my-6 sm:ml-6 [&>li]:mt-2 sm:[&>li]:mt-3",
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      className={cn(
        "text-sm leading-relaxed marker:text-[var(--marketing-accent)] sm:text-base sm:leading-7",
        className
      )}
      {...props}
    />
  ),

  // Blockquote - responsive padding
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 rounded-r-xl border-[var(--marketing-accent)] border-l-4 bg-[var(--marketing-bg-elevated)] py-3 pr-3 pl-4 text-[var(--marketing-text-muted)] text-sm italic sm:my-8 sm:py-4 sm:pr-4 sm:pl-6 sm:text-base",
        className
      )}
      {...props}
    />
  ),

  // Code - responsive sizing
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "relative break-words rounded-md bg-[var(--marketing-bg-elevated)] px-1 py-[0.1rem] font-medium font-mono text-[0.8em] text-[var(--marketing-accent)] sm:px-[0.4rem] sm:py-[0.15rem] sm:text-[0.85em]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mt-4 mb-4 overflow-x-auto rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 font-mono text-xs leading-relaxed shadow-sm sm:mt-6 sm:mb-6 sm:rounded-xl sm:p-4 sm:text-sm",
        className
      )}
      {...props}
    />
  ),

  // Links - responsive and better word breaking
  a: ({ className, href, ...props }) => {
    const isExternal = href?.startsWith("http");

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "break-words font-medium text-[var(--marketing-accent)] underline decoration-[var(--marketing-accent)]/30 underline-offset-4 transition-colors hover:decoration-[var(--marketing-accent)]",
            className
          )}
          {...props}
        />
      );
    }

    return (
      <Link
        href={href ?? "#"}
        className={cn(
          "break-words font-medium text-[var(--marketing-accent)] underline decoration-[var(--marketing-accent)]/30 underline-offset-4 transition-colors hover:decoration-[var(--marketing-accent)]",
          className
        )}
        {...props}
      />
    );
  },

  // Table - Enhanced with responsive styling
  table: ({ className, ...props }) => (
    <div className="my-6 w-full max-w-full overflow-x-auto rounded-lg border border-[var(--marketing-border)] shadow-sm sm:my-8 sm:rounded-xl">
      <table className={cn("w-full border-collapse text-xs sm:text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-[var(--marketing-bg-elevated)]", className)} {...props} />
  ),
  tbody: ({ className, ...props }) => (
    <tbody className={cn("divide-y divide-[var(--marketing-border)]", className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn("transition-colors hover:bg-[var(--marketing-bg-elevated)]/50", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "whitespace-nowrap border-[var(--marketing-border)] border-b bg-[var(--marketing-bg-elevated)] px-3 py-2 text-left font-semibold text-[var(--marketing-text)] sm:px-4 sm:py-3 [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-3 py-2 text-[var(--marketing-text-muted)] sm:px-4 sm:py-3 [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),

  // Horizontal Rule - responsive margin
  hr: ({ ...props }) => (
    <hr className="my-8 border-[var(--marketing-border)] sm:my-12" {...props} />
  ),

  // Image - responsive border radius and margin
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn(
        "my-6 w-full rounded-xl border border-[var(--marketing-border)] shadow-lg sm:my-8 sm:rounded-2xl",
        className
      )}
      alt={alt}
      {...props}
    />
  ),

  // Strong/Bold
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-[var(--marketing-text)]", className)} {...props} />
  ),
};

/**
 * Callout component for MDX - responsive
 */
export function Callout({
  children,
  type = "info",
  title,
}: {
  children: React.ReactNode;
  type?: "info" | "warning" | "error" | "success" | "tip";
  title?: string;
}) {
  const styles = {
    info: "border-blue-500/30 bg-blue-50 text-blue-900",
    warning: "border-amber-500/30 bg-amber-50 text-amber-900",
    error: "border-red-500/30 bg-red-50 text-red-900",
    success: "border-emerald-500/30 bg-emerald-50 text-emerald-900",
    tip: "border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 text-[var(--marketing-text)]",
  };

  const icons = {
    info: <Info className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />,
    error: <XCircle className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />,
    success: <CheckCircle className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />,
    tip: <Lightbulb className="h-4 w-4 text-[var(--marketing-accent)] sm:h-5 sm:w-5" />,
  };

  const titles = {
    info: "Info",
    warning: "Warning",
    error: "Error",
    success: "Success",
    tip: "Pro Tip",
  };

  return (
    <div
      className={cn(
        "my-6 rounded-lg border p-3 shadow-sm sm:my-8 sm:rounded-xl sm:p-4",
        styles[type]
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="mt-0.5 shrink-0">{icons[type]}</div>
        <div className="min-w-0 flex-1">
          {(title || titles[type]) && (
            <p className="mb-1 font-semibold text-sm sm:text-base">{title || titles[type]}</p>
          )}
          <div className="text-xs leading-relaxed opacity-90 sm:text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * InfoBox component for MDX - a simpler callout for tips (responsive)
 */
export function InfoBox({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="my-4 flex items-start gap-2 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 sm:my-6 sm:gap-3 sm:rounded-xl sm:p-4">
      <div className="mt-0.5 shrink-0 text-[var(--marketing-accent)]">
        {icon || <Zap className="h-4 w-4 sm:h-5 sm:w-5" />}
      </div>
      <div className="flex-1 text-[var(--marketing-text-muted)] text-xs leading-relaxed sm:text-sm">
        {children}
      </div>
    </div>
  );
}

/**
 * Video embed component for MDX (responsive)
 */
export function VideoEmbed({
  src,
  title = "Video",
}: {
  src: string;
  title?: string;
}) {
  // Support YouTube and Vimeo
  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");
  const isVimeo = src.includes("vimeo.com");

  let embedUrl = src;
  if (isYouTube) {
    const videoId = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)?.[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (isVimeo) {
    const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  }

  return (
    <div className="my-6 aspect-video w-full overflow-hidden rounded-lg border border-[var(--marketing-border)] shadow-lg sm:my-8 sm:rounded-xl">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

/**
 * Comparison table component for feature comparisons (responsive)
 */
export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ feature: string; values: (string | boolean)[] }>;
}) {
  return (
    <div className="-mx-4 my-6 w-full overflow-x-auto rounded-lg border border-[var(--marketing-border)] shadow-sm sm:mx-0 sm:my-8 sm:rounded-xl">
      <table className="w-full min-w-[400px] border-collapse text-xs sm:text-sm">
        <thead className="bg-[var(--marketing-bg-elevated)]">
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                className={cn(
                  "border-[var(--marketing-border)] border-b px-3 py-2 font-semibold text-[var(--marketing-text)] sm:px-4 sm:py-3",
                  i === 0 ? "text-left" : "text-center"
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--marketing-border)]">
          {rows.map((row) => (
            <tr
              key={row.feature}
              className="transition-colors hover:bg-[var(--marketing-bg-elevated)]/50"
            >
              <td className="px-3 py-2 font-medium text-[var(--marketing-text)] sm:px-4 sm:py-3">
                {row.feature}
              </td>
              {row.values.map((value, j) => (
                <td key={`${row.feature}-${j}`} className="px-3 py-2 text-center sm:px-4 sm:py-3">
                  {typeof value === "boolean" ? (
                    value ? (
                      <CheckCircle className="mx-auto h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-gray-300 sm:h-5 sm:w-5" />
                    )
                  ) : (
                    <span className="text-[var(--marketing-text-muted)]">{value}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

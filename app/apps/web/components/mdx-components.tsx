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
          "mt-6 sm:mt-8 scroll-m-20 sm:scroll-m-24 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--marketing-text)]",
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
          "mt-8 sm:mt-10 md:mt-12 scroll-m-20 sm:scroll-m-24 border-b border-[var(--marketing-border)] pb-2 sm:pb-3 text-xl sm:text-2xl font-bold tracking-tight text-[var(--marketing-text)] first:mt-0",
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
          "mt-6 sm:mt-8 md:mt-10 scroll-m-20 sm:scroll-m-24 text-lg sm:text-xl font-semibold tracking-tight text-[var(--marketing-text)]",
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
          "mt-5 sm:mt-6 md:mt-8 scroll-m-20 sm:scroll-m-24 text-base sm:text-lg font-semibold tracking-tight text-[var(--marketing-text)]",
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
        "text-sm sm:text-base leading-relaxed sm:leading-7 text-[var(--marketing-text-muted)] [&:not(:first-child)]:mt-4 sm:[&:not(:first-child)]:mt-6",
        className
      )}
      {...props}
    />
  ),

  // Lists - responsive spacing
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-4 sm:my-6 ml-4 sm:ml-6 list-disc text-[var(--marketing-text-muted)] [&>li]:mt-2 sm:[&>li]:mt-3",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 sm:my-6 ml-4 sm:ml-6 list-decimal text-[var(--marketing-text-muted)] [&>li]:mt-2 sm:[&>li]:mt-3",
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      className={cn(
        "text-sm sm:text-base leading-relaxed sm:leading-7 marker:text-[var(--marketing-accent)]",
        className
      )}
      {...props}
    />
  ),

  // Blockquote - responsive padding
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 sm:my-8 border-l-4 border-[var(--marketing-accent)] bg-[var(--marketing-bg-elevated)] py-3 sm:py-4 pl-4 sm:pl-6 pr-3 sm:pr-4 italic text-sm sm:text-base text-[var(--marketing-text-muted)] rounded-r-xl",
        className
      )}
      {...props}
    />
  ),

  // Code - responsive sizing
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "relative rounded-md bg-[var(--marketing-bg-elevated)] px-1 sm:px-[0.4rem] py-[0.1rem] sm:py-[0.15rem] font-mono text-[0.8em] sm:text-[0.85em] font-medium text-[var(--marketing-accent)] break-words",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-4 sm:mb-6 mt-4 sm:mt-6 overflow-x-auto rounded-lg sm:rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed shadow-sm",
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
            "font-medium text-[var(--marketing-accent)] underline underline-offset-4 decoration-[var(--marketing-accent)]/30 transition-colors hover:decoration-[var(--marketing-accent)] break-words",
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
          "font-medium text-[var(--marketing-accent)] underline underline-offset-4 decoration-[var(--marketing-accent)]/30 transition-colors hover:decoration-[var(--marketing-accent)] break-words",
          className
        )}
        {...props}
      />
    );
  },

  // Table - Enhanced with responsive styling
  table: ({ className, ...props }) => (
    <div className="my-6 sm:my-8 w-full max-w-full overflow-x-auto rounded-lg sm:rounded-xl border border-[var(--marketing-border)] shadow-sm">
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
        "px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-[var(--marketing-text)] bg-[var(--marketing-bg-elevated)] border-b border-[var(--marketing-border)] whitespace-nowrap [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-3 sm:px-4 py-2 sm:py-3 text-[var(--marketing-text-muted)] [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),

  // Horizontal Rule - responsive margin
  hr: ({ ...props }) => (
    <hr className="my-8 sm:my-12 border-[var(--marketing-border)]" {...props} />
  ),

  // Image - responsive border radius and margin
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn(
        "rounded-xl sm:rounded-2xl border border-[var(--marketing-border)] shadow-lg my-6 sm:my-8 w-full",
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
    info: <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />,
    error: <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />,
    success: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />,
    tip: <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--marketing-accent)]" />,
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
        "my-6 sm:my-8 rounded-lg sm:rounded-xl border p-3 sm:p-4 shadow-sm",
        styles[type]
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="mt-0.5 shrink-0">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          {(title || titles[type]) && (
            <p className="font-semibold mb-1 text-sm sm:text-base">{title || titles[type]}</p>
          )}
          <div className="text-xs sm:text-sm leading-relaxed opacity-90">{children}</div>
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
    <div className="my-4 sm:my-6 flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 sm:p-4">
      <div className="mt-0.5 shrink-0 text-[var(--marketing-accent)]">
        {icon || <Zap className="h-4 w-4 sm:h-5 sm:w-5" />}
      </div>
      <div className="flex-1 text-xs sm:text-sm leading-relaxed text-[var(--marketing-text-muted)]">
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
    <div className="my-6 sm:my-8 aspect-video w-full overflow-hidden rounded-lg sm:rounded-xl border border-[var(--marketing-border)] shadow-lg">
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
    <div className="my-6 sm:my-8 w-full overflow-x-auto rounded-lg sm:rounded-xl border border-[var(--marketing-border)] shadow-sm -mx-4 sm:mx-0">
      <table className="w-full border-collapse text-xs sm:text-sm min-w-[400px]">
        <thead className="bg-[var(--marketing-bg-elevated)]">
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                className={cn(
                  "px-3 sm:px-4 py-2 sm:py-3 font-semibold text-[var(--marketing-text)] border-b border-[var(--marketing-border)]",
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
              className="hover:bg-[var(--marketing-bg-elevated)]/50 transition-colors"
            >
              <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-[var(--marketing-text)]">
                {row.feature}
              </td>
              {row.values.map((value, j) => (
                <td key={`${row.feature}-${j}`} className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                  {typeof value === "boolean" ? (
                    value ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-auto" />
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

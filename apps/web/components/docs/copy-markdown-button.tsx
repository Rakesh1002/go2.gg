"use client";

/**
 * Copy Markdown Button
 *
 * Copies the current page content as markdown to clipboard.
 * Shows a dropdown with options: Copy as Markdown, Open Raw.
 */

import * as React from "react";
import { Check, Copy, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyMarkdownButtonProps {
  slug: string;
  title: string;
  description?: string;
  content: string;
}

export function CopyMarkdownButton({ slug, title, description, content }: CopyMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const markdown = `# ${title}

${description ? `> ${description}\n\n` : ""}${content}
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const handleOpenRaw = () => {
    window.open(`/docs/raw/${slug}`, "_blank");
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Page options"}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Copy page as markdown</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenRaw}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open raw markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

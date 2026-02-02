"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  BarChart2,
  Pencil,
  Trash2,
  QrCode,
  Lock,
  Clock,
  MousePointer,
  Globe,
  Link2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Link {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  hasPassword: boolean;
  tags: string[];
}

interface LinkCardProps {
  link: Link;
  onDelete?: () => void;
  /** Compact variant for use in CardList */
  variant?: "default" | "compact";
  /** Whether the link is selected (for CardList) */
  selected?: boolean;
  /** Callback when selection changes */
  onSelect?: () => void;
}

export function LinkCard({
  link,
  onDelete,
  variant = "default",
  selected = false,
  onSelect,
}: LinkCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(link.shortUrl);
    toast.success("Copied to clipboard");
  }, [link.shortUrl]);

  const deleteLink = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    setDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const response = await fetch(`${apiUrl}/api/v1/links/${link.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete link");

      toast.success("Link deleted");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    } finally {
      setDeleting(false);
    }
  }, [link.id, onDelete]);

  // Compact variant for use in CardList
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-4 py-3 px-4", selected && "bg-primary/5")}>
        {/* Favicon / Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Link2 className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary truncate"
            >
              {link.domain}/{link.slug}
            </a>
            <CopyButton
              value={link.shortUrl}
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            />
            {link.hasPassword && (
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Password protected</TooltipContent>
              </Tooltip>
            )}
            {link.expiresAt && (
              <Tooltip>
                <TooltipTrigger>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Expires {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {link.title || link.destinationUrl}
          </p>
        </div>

        {/* Click count */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MousePointer className="h-4 w-4" />
          <span className="font-medium tabular-nums">{link.clickCount.toLocaleString()}</span>
        </div>

        {/* Created date */}
        <div className="hidden sm:block text-sm text-muted-foreground w-24 text-right">
          {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={deleting}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}`)}>
              <BarChart2 className="mr-2 h-4 w-4" />
              View analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/qr`)}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={deleteLink}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-primary hover:underline truncate"
              >
                {link.shortUrl}
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={copyToClipboard}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {link.title && <p className="text-sm text-muted-foreground">{link.title}</p>}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}`)}>
                <BarChart2 className="mr-2 h-4 w-4" />
                View analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/qr`)}>
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={deleteLink}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <a
            href={link.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:text-foreground hover:underline"
          >
            {link.destinationUrl}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {link.hasPassword && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Protected
              </Badge>
            )}
            {link.expiresAt && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Expires
              </Badge>
            )}
            {link.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium">{link.clickCount.toLocaleString()} clicks</span>
            <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

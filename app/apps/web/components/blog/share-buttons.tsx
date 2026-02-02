"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Facebook, Link2, Check, Share2, Mail } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "horizontal" | "vertical" | "floating";
}

/**
 * Social share buttons component
 */
export function ShareButtons({
  url,
  title,
  description,
  className,
  variant = "horizontal",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const buttons = [
    {
      name: "Twitter",
      icon: Twitter,
      href: shareLinks.twitter,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: shareLinks.linkedin,
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: shareLinks.facebook,
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    {
      name: "Email",
      icon: Mail,
      href: shareLinks.email,
      color: "hover:bg-gray-100 hover:text-gray-700",
    },
  ];

  const containerClasses = {
    horizontal: "flex items-center gap-2",
    vertical: "flex flex-col gap-2",
    floating: "fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40 hidden xl:flex",
  };

  const buttonSize = variant === "floating" ? "h-10 w-10" : "h-9 w-9";

  return (
    <div className={cn(containerClasses[variant], className)}>
      {variant !== "floating" && (
        <span className="text-sm font-medium text-[var(--marketing-text-muted)] mr-2">Share</span>
      )}

      {buttons.map((button) => (
        <a
          key={button.name}
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${button.name}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              buttonSize,
              "rounded-full text-[var(--marketing-text-muted)] transition-colors",
              button.color,
              variant === "floating" && "bg-white shadow-md border border-[var(--marketing-border)]"
            )}
          >
            <button.icon className="h-4 w-4" />
            <span className="sr-only">Share on {button.name}</span>
          </Button>
        </a>
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={copyToClipboard}
        title="Copy link"
        className={cn(
          buttonSize,
          "rounded-full text-[var(--marketing-text-muted)] transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]",
          variant === "floating" && "bg-white shadow-md border border-[var(--marketing-border)]"
        )}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
        <span className="sr-only">Copy link</span>
      </Button>
    </div>
  );
}

/**
 * Compact share button that opens a dropdown
 */
export function ShareButton({
  url,
  title,
  description,
  className,
}: Omit<ShareButtonsProps, "variant">) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]/30"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl border border-[var(--marketing-border)] shadow-lg p-2 min-w-[200px]">
            <ShareButtons url={url} title={title} description={description} variant="vertical" />
          </div>
        </>
      )}
    </div>
  );
}

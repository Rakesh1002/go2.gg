"use client";

import { useState } from "react";
import Image from "next/image";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
}

interface GalleryData {
  id: string;
  slug: string;
  domain: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  themeConfig: Record<string, unknown> | null;
  socialLinks: Array<{ platform: string; url: string }>;
  customCss: string | null;
  items: GalleryItem[];
}

const THEME_STYLES: Record<
  string,
  {
    background: string;
    text: string;
    card: string;
    cardHover: string;
    border: string;
  }
> = {
  default: {
    background: "bg-gray-50",
    text: "text-gray-900",
    card: "bg-white",
    cardHover: "hover:bg-gray-50",
    border: "border-gray-200",
  },
  minimal: {
    background: "bg-white",
    text: "text-gray-900",
    card: "bg-gray-100",
    cardHover: "hover:bg-gray-200",
    border: "border-gray-300",
  },
  gradient: {
    background: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    text: "text-white",
    card: "bg-white/20 backdrop-blur-sm",
    cardHover: "hover:bg-white/30",
    border: "border-white/30",
  },
  dark: {
    background: "bg-gray-900",
    text: "text-white",
    card: "bg-gray-800",
    cardHover: "hover:bg-gray-700",
    border: "border-gray-700",
  },
  neon: {
    background: "bg-black",
    text: "text-white",
    card: "bg-gray-900 ring-1 ring-cyan-500/50",
    cardHover: "hover:ring-cyan-400",
    border: "border-cyan-500",
  },
};

const SOCIAL_ICONS: Record<string, string> = {
  twitter: "Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "Linkedin",
  youtube: "Youtube",
  tiktok: "Music",
  github: "Github",
  twitch: "Twitch",
  discord: "MessageCircle",
  email: "Mail",
  website: "Globe",
};

interface BioPageClientProps {
  gallery: GalleryData;
}

export function BioPageClient({ gallery }: BioPageClientProps) {
  const [clickedItems, setClickedItems] = useState<Set<string>>(new Set());

  const theme = THEME_STYLES[gallery.theme] ?? THEME_STYLES.default;

  async function trackClick(itemId: string) {
    if (clickedItems.has(itemId)) return;

    setClickedItems((prev) => new Set(prev).add(itemId));

    try {
      await fetch(`${API_URL}/api/v1/public/galleries/${gallery.id}/items/${itemId}/click`, {
        method: "POST",
      });
    } catch (error) {
      // Silent fail for tracking
    }
  }

  function getIcon(iconName: string | null): LucideIcon {
    if (!iconName) return Icons.Link2;
    const icon = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return icon ?? Icons.Link2;
  }

  return (
    <div className={cn("min-h-screen py-8 px-4", theme.background)}>
      {gallery.customCss && <style dangerouslySetInnerHTML={{ __html: gallery.customCss }} />}

      <div className="mx-auto max-w-md space-y-6">
        {/* Avatar & Bio */}
        <div className="text-center">
          {gallery.avatarUrl && (
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/20">
              <Image
                src={gallery.avatarUrl}
                alt={gallery.title ?? gallery.slug}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {gallery.title && (
            <h1 className={cn("text-xl font-bold", theme.text)}>{gallery.title}</h1>
          )}
          {gallery.bio && (
            <p className={cn("mt-2 text-sm opacity-80", theme.text)}>{gallery.bio}</p>
          )}
        </div>

        {/* Social Links */}
        {gallery.socialLinks && gallery.socialLinks.length > 0 && (
          <div className="flex justify-center gap-3">
            {gallery.socialLinks.map((social) => {
              const iconName = SOCIAL_ICONS[social.platform.toLowerCase()] ?? "Link2";
              const IconComponent =
                (Icons as unknown as Record<string, LucideIcon>)[iconName] ?? Icons.Link2;

              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    theme.card,
                    theme.cardHover
                  )}
                >
                  <IconComponent className={cn("h-5 w-5", theme.text)} />
                </a>
              );
            })}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {gallery.items.map((item) => {
            if (item.type === "divider") {
              return <div key={item.id} className={cn("my-4 h-px", theme.border)} />;
            }

            if (item.type === "header") {
              return (
                <h2
                  key={item.id}
                  className={cn(
                    "pt-4 text-center text-sm font-semibold uppercase tracking-wider opacity-70",
                    theme.text
                  )}
                >
                  {item.title}
                </h2>
              );
            }

            if (item.type === "link" && item.url) {
              const IconComponent = getIcon(item.iconName);

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 transition-all duration-200",
                    theme.card,
                    theme.cardHover,
                    theme.border,
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {item.thumbnailUrl ? (
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title ?? ""}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        theme.text,
                        "opacity-60"
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  )}
                  <span className={cn("flex-1 font-medium", theme.text)}>
                    {item.title || item.url}
                  </span>
                  <Icons.ChevronRight className={cn("h-5 w-5 opacity-50", theme.text)} />
                </a>
              );
            }

            if (item.type === "embed" && item.embedType === "youtube" && item.embedData?.videoId) {
              return (
                <div key={item.id} className="aspect-video overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${item.embedData.videoId}`}
                    title={item.title ?? "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              );
            }

            if (item.type === "image" && item.thumbnailUrl) {
              return (
                <div key={item.id} className="overflow-hidden rounded-xl">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title ?? "Image"}
                    width={400}
                    height={300}
                    className="w-full object-cover"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Branding */}
        <div className="pt-8 text-center">
          <a
            href="https://go2.gg"
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-xs opacity-50 hover:opacity-75", theme.text)}
          >
            Powered by Go2
          </a>
        </div>
      </div>
    </div>
  );
}

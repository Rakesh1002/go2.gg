"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Twitter,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  Facebook,
  Music,
  Globe,
  Mail,
  ExternalLink,
} from "lucide-react";

interface Gallery {
  id: string;
  slug: string;
  domain: string;
  url: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  themeConfig: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    buttonStyle?: "rounded" | "pill" | "square";
    backgroundImage?: string;
  } | null;
  socialLinks: Array<{ platform: string; url: string }>;
  customCss: string | null;
  items: GalleryItem[];
}

interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  isVisible: boolean;
  clickCount: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const SOCIAL_ICONS: Record<string, typeof Twitter> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  tiktok: Music,
  spotify: Music,
  email: Mail,
  website: Globe,
};

const THEME_STYLES: Record<
  string,
  { bg: string; text: string; button: string; buttonHover: string }
> = {
  default: {
    bg: "bg-white",
    text: "text-gray-900",
    button: "bg-gray-900 text-white",
    buttonHover: "hover:bg-gray-800",
  },
  minimal: {
    bg: "bg-gray-50",
    text: "text-gray-800",
    button: "bg-white text-gray-900 border border-gray-200",
    buttonHover: "hover:bg-gray-100",
  },
  gradient: {
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    text: "text-white",
    button: "bg-white/20 backdrop-blur text-white border border-white/30",
    buttonHover: "hover:bg-white/30",
  },
  dark: {
    bg: "bg-gray-950",
    text: "text-white",
    button: "bg-gray-800 text-white border border-gray-700",
    buttonHover: "hover:bg-gray-700",
  },
  neon: {
    bg: "bg-black",
    text: "text-green-400",
    button: "bg-transparent text-green-400 border-2 border-green-400",
    buttonHover: "hover:bg-green-400 hover:text-black",
  },
  pastel: {
    bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
    text: "text-gray-700",
    button: "bg-white/70 backdrop-blur text-gray-700 border border-white",
    buttonHover: "hover:bg-white",
  },
};

interface BioPageRendererProps {
  gallery: Gallery;
}

export function BioPageRenderer({ gallery }: BioPageRendererProps) {
  const theme = THEME_STYLES[gallery.theme] ?? THEME_STYLES.default;
  const buttonRadius =
    gallery.themeConfig?.buttonStyle === "pill"
      ? "rounded-full"
      : gallery.themeConfig?.buttonStyle === "square"
        ? "rounded-none"
        : "rounded-xl";

  async function trackClick(itemId: string) {
    try {
      await fetch(
        `${API_URL}/api/v1/galleries/public/${gallery.domain}/${gallery.slug}/items/${itemId}/click`,
        { method: "POST" }
      );
    } catch (error) {
      // Silent fail for tracking
    }
  }

  function getEmbedHtml(item: GalleryItem) {
    if (item.embedType === "youtube" && item.url) {
      const videoId = item.url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      )?.[1];
      if (videoId) {
        return (
          <iframe
            width="100%"
            height="200"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={item.title ?? "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-xl"
          />
        );
      }
    }
    if (item.embedType === "spotify" && item.url) {
      const spotifyUri = item.url.replace("https://open.spotify.com/", "").replace("/", ":");
      return (
        <iframe
          src={`https://open.spotify.com/embed/${spotifyUri.replace(":", "/")}`}
          width="100%"
          height="152"
          allow="encrypted-media"
          className="rounded-xl"
        />
      );
    }
    return null;
  }

  return (
    <>
      {/* Custom CSS */}
      {gallery.customCss && <style dangerouslySetInnerHTML={{ __html: gallery.customCss }} />}

      <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
        {/* Background image overlay */}
        {gallery.themeConfig?.backgroundImage && (
          <div
            className="fixed inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${gallery.themeConfig.backgroundImage})` }}
          />
        )}

        <div className="relative mx-auto max-w-lg px-4 py-12">
          {/* Avatar & Bio */}
          <div className="flex flex-col items-center text-center">
            {gallery.avatarUrl ? (
              <img
                src={gallery.avatarUrl}
                alt={gallery.title ?? `@${gallery.slug}`}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold shadow-lg">
                {gallery.title?.[0]?.toUpperCase() ?? gallery.slug[0]?.toUpperCase()}
              </div>
            )}

            <h1 className="mt-6 text-2xl font-bold">{gallery.title ?? `@${gallery.slug}`}</h1>

            {gallery.bio && <p className="mt-3 max-w-sm opacity-80">{gallery.bio}</p>}

            {/* Social Links */}
            {gallery.socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {gallery.socialLinks.map((social, index) => {
                  const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] ?? Globe;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mt-10 space-y-4">
            {gallery.items
              .filter((item) => item.isVisible)
              .sort((a, b) => a.position - b.position)
              .map((item) => {
                if (item.type === "divider") {
                  return (
                    <div key={item.id} className="py-2">
                      <hr className="border-current opacity-20" />
                    </div>
                  );
                }

                if (item.type === "header") {
                  return (
                    <div key={item.id} className="py-2">
                      <p className="text-sm font-semibold uppercase tracking-wider opacity-60">
                        {item.title}
                      </p>
                    </div>
                  );
                }

                if (item.type === "embed") {
                  const embedHtml = getEmbedHtml(item);
                  if (embedHtml) {
                    return (
                      <div key={item.id}>
                        {item.title && (
                          <p className="mb-2 text-sm font-medium opacity-60">{item.title}</p>
                        )}
                        {embedHtml}
                      </div>
                    );
                  }
                }

                if (item.type === "image" && item.url) {
                  return (
                    <div key={item.id}>
                      <img
                        src={item.url}
                        alt={item.title ?? "Image"}
                        className={`w-full object-cover ${buttonRadius}`}
                      />
                    </div>
                  );
                }

                // Default: Link
                if (item.url) {
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(item.id)}
                      className={`group flex items-center justify-between p-4 ${theme.button} ${theme.buttonHover} ${buttonRadius} transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                }

                return null;
              })}
          </div>

          {/* Footer */}
          <div className="mt-16 text-center opacity-50">
            <Link href="/" className="text-sm hover:opacity-100 transition-opacity">
              Powered by Go2
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

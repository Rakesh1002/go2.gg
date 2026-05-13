"use client";

import { useState } from "react";
import Image from "next/image";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBioTheme, buttonRadiusClass, type BioThemeConfig } from "@/lib/bio/themes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image" | "email_signup";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  /** Set when the item is gated; URL is omitted server-side until unlock. */
  gate?: { kind: "password" | "email" } | null;
}

interface GalleryData {
  id: string;
  slug: string;
  domain: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  themeConfig: BioThemeConfig | null;
  socialLinks: Array<{ platform: string; url: string }>;
  customCss: string | null;
  hideBranding?: boolean;
  items: GalleryItem[];
}

// Pull a 32-px favicon for an arbitrary URL via Google's resolver — bumps
// link cards from "raw URL" to "looks branded" without us having to scrape.
function faviconFor(url: string): string | null {
  try {
    const host = new URL(url).host;
    return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
  } catch {
    return null;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

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

// Convert a Spotify URL or URI to the path piece used by the embed iframe:
//   https://open.spotify.com/track/abc123       -> track/abc123
//   https://open.spotify.com/playlist/xyz?si=…  -> playlist/xyz
//   spotify:album:abc123                        -> album/abc123
function spotifyEmbedPath(url: string): string | null {
  try {
    if (url.startsWith("spotify:")) {
      const [, kind, id] = url.split(":");
      if (kind && id) return `${kind}/${id}`;
      return null;
    }
    const u = new URL(url);
    if (!u.hostname.endsWith("spotify.com")) return null;
    const segs = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (segs.length < 2) return null;
    return `${segs[0]}/${segs[1]}`;
  } catch {
    return null;
  }
}

interface BioPageClientProps {
  gallery: GalleryData;
}

export function BioPageClient({ gallery }: BioPageClientProps) {
  const [clickedItems, setClickedItems] = useState<Set<string>>(new Set());

  const theme = getBioTheme(gallery.theme).styles;
  const cfg: BioThemeConfig = gallery.themeConfig ?? {};
  // themeConfig overrides the preset's CSS via inline styles. We don't
  // generate Tailwind classes at runtime — Tailwind would purge them.
  const overrideStyle: React.CSSProperties = {
    ...(cfg.backgroundColor ? { background: cfg.backgroundColor } : {}),
    ...(cfg.textColor ? { color: cfg.textColor } : {}),
    ...(cfg.fontFamily ? { fontFamily: cfg.fontFamily } : {}),
  };
  const buttonRadius = buttonRadiusClass(cfg.buttonStyle);

  async function trackClick(itemId: string) {
    if (clickedItems.has(itemId)) return;

    setClickedItems((prev) => new Set(prev).add(itemId));

    try {
      await fetch(`${API_URL}/api/v1/public/galleries/${gallery.id}/items/${itemId}/click`, {
        method: "POST",
      });
    } catch (_error) {
      // Silent fail for tracking
    }
  }

  function getIcon(iconName: string | null): LucideIcon {
    if (!iconName) return Icons.Link2;
    const icon = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return icon ?? Icons.Link2;
  }

  return (
    <div
      className={cn("min-h-screen px-4 py-8", theme.background)}
      style={overrideStyle}
    >
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
            <h1 className={cn("font-bold text-xl", theme.text)}>{gallery.title}</h1>
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
                    "pt-4 text-center font-semibold text-sm uppercase tracking-wider opacity-70",
                    theme.text
                  )}
                >
                  {item.title}
                </h2>
              );
            }

            if (item.type === "email_signup") {
              return (
                <EmailSignupCard
                  key={item.id}
                  item={item}
                  galleryId={gallery.id}
                  theme={theme}
                  buttonRadius={buttonRadius}
                  accent={cfg.primaryColor}
                />
              );
            }

            if (item.gate) {
              return (
                <GatedItemCard
                  key={item.id}
                  item={item}
                  galleryId={gallery.id}
                  theme={theme}
                  buttonRadius={buttonRadius}
                  accent={cfg.primaryColor}
                  onUnlocked={() => trackClick(item.id)}
                />
              );
            }

            if (item.type === "link" && item.url) {
              const IconComponent = getIcon(item.iconName);
              const accentBg = cfg.primaryColor ? { background: cfg.primaryColor } : undefined;
              const host = safeHost(item.url);
              // OG-enriched card: only when the server-side unfurl wrote a
              // thumbnail AND we have title or description. Falls back to the
              // compact card otherwise.
              const hasOgCard = !!item.thumbnailUrl && !!(item.title || item.ogTitle);
              if (hasOgCard) {
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(item.id)}
                    className={cn(
                      "group block overflow-hidden border transition-all duration-200",
                      theme.card,
                      theme.cardHover,
                      theme.border,
                      buttonRadius,
                      "hover:scale-[1.01] active:scale-[0.99]"
                    )}
                    style={accentBg}
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={item.thumbnailUrl as string}
                        alt={item.title ?? ""}
                        fill
                        sizes="(max-width: 480px) 90vw, 480px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-start gap-3 p-4">
                      {host && (
                        <img
                          src={faviconFor(item.url) ?? ""}
                          alt=""
                          width={20}
                          height={20}
                          className="mt-0.5 h-5 w-5 rounded"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate font-semibold text-sm", theme.text)}>
                          {item.title || item.ogTitle}
                        </p>
                        {item.ogDescription && (
                          <p className={cn("mt-1 line-clamp-2 text-xs opacity-70", theme.text)}>
                            {item.ogDescription}
                          </p>
                        )}
                        {host && (
                          <p className={cn("mt-1 text-xs opacity-50", theme.text)}>{host}</p>
                        )}
                      </div>
                      <Icons.ChevronRight
                        className={cn(
                          "mt-1 h-5 w-5 opacity-40 transition-transform group-hover:translate-x-0.5",
                          theme.text
                        )}
                      />
                    </div>
                  </a>
                );
              }
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(item.id)}
                  className={cn(
                    "group flex items-center gap-3 border p-4 transition-all duration-200",
                    theme.card,
                    theme.cardHover,
                    theme.border,
                    buttonRadius,
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  style={accentBg}
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
                  ) : faviconFor(item.url) ? (
                    <img
                      src={faviconFor(item.url) as string}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg"
                    />
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
                  <Icons.ChevronRight
                    className={cn(
                      "h-5 w-5 opacity-50 transition-transform group-hover:translate-x-0.5",
                      theme.text
                    )}
                  />
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

            if (item.type === "embed" && item.embedType === "spotify" && item.url) {
              const path = spotifyEmbedPath(item.url);
              if (path) {
                return (
                  <div key={item.id} className="overflow-hidden rounded-xl">
                    <iframe
                      src={`https://open.spotify.com/embed/${path}`}
                      title={item.title ?? "Spotify"}
                      allow="encrypted-media"
                      loading="lazy"
                      className="h-[152px] w-full"
                    />
                  </div>
                );
              }
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

        {/* Branding — Pro+ users can hide via gallery.hideBranding. */}
        {!gallery.hideBranding && (
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
        )}
      </div>
    </div>
  );
}

interface ThemeStyles {
  background: string;
  text: string;
  card: string;
  cardHover: string;
  border: string;
}

function EmailSignupCard({
  item,
  galleryId,
  theme,
  buttonRadius,
  accent,
}: {
  item: GalleryItem;
  galleryId: string;
  theme: ThemeStyles;
  buttonRadius: string;
  accent: string | undefined;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const cfg = (item.embedData ?? {}) as {
    headline?: string;
    buttonLabel?: string;
    postSubmitMessage?: string;
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("submitting");
    try {
      const r = await fetch(
        `${API_URL}/api/v1/public/galleries/${galleryId}/items/${item.id}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "signup" }),
        }
      );
      setState(r.ok ? "ok" : "err");
    } catch {
      setState("err");
    }
  }
  if (state === "ok") {
    return (
      <div
        className={cn(
          "border p-4 text-center text-sm",
          theme.card,
          theme.border,
          buttonRadius,
          theme.text
        )}
      >
        {cfg.postSubmitMessage ?? "Thanks — you're on the list."}
      </div>
    );
  }
  return (
    <form
      onSubmit={submit}
      className={cn(
        "space-y-3 border p-4",
        theme.card,
        theme.border,
        buttonRadius
      )}
    >
      <div className={cn("text-center font-medium text-sm", theme.text)}>
        {cfg.headline ?? item.title ?? "Subscribe"}
      </div>
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          "w-full border px-3 py-2 outline-none",
          theme.border,
          buttonRadius,
          "bg-transparent",
          theme.text
        )}
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className={cn(
          "w-full px-3 py-2 font-medium text-sm transition-opacity disabled:opacity-50",
          buttonRadius
        )}
        style={
          accent
            ? { background: accent, color: "#fff" }
            : { background: "currentColor", color: "transparent" }
        }
      >
        <span style={accent ? undefined : { color: "var(--bg-of-card, #fff)", mixBlendMode: "difference" }}>
          {state === "submitting" ? "…" : cfg.buttonLabel ?? "Subscribe"}
        </span>
      </button>
      {state === "err" && (
        <div className="text-center text-red-500 text-xs">Something went wrong, try again.</div>
      )}
    </form>
  );
}

function GatedItemCard({
  item,
  galleryId,
  theme,
  buttonRadius,
  accent,
  onUnlocked,
}: {
  item: GalleryItem;
  galleryId: string;
  theme: ThemeStyles;
  buttonRadius: string;
  accent: string | undefined;
  onUnlocked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "err">("idle");
  const kind = item.gate?.kind ?? "password";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    try {
      const r = await fetch(
        `${API_URL}/api/v1/public/galleries/${galleryId}/items/${item.id}/unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kind === "password" ? { password } : { email }),
        }
      );
      const result = await r.json();
      if (r.ok && result?.data?.url) {
        onUnlocked();
        window.open(result.data.url, "_blank", "noopener,noreferrer");
        setOpen(false);
        setState("idle");
        setPassword("");
        setEmail("");
      } else {
        setState("err");
      }
    } catch {
      setState("err");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full items-center gap-3 border p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
          theme.card,
          theme.cardHover,
          theme.border,
          buttonRadius
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            theme.text,
            "opacity-60"
          )}
        >
          <Icons.Lock className="h-5 w-5" />
        </div>
        <span className={cn("flex-1 font-medium", theme.text)}>{item.title || "Locked"}</span>
        <span className={cn("text-xs opacity-60", theme.text)}>
          {kind === "password" ? "Password" : "Email"}
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3 rounded-xl bg-white p-5 text-gray-900 shadow-xl"
          >
            <h3 className="font-semibold text-base">{item.title ?? "Unlock content"}</h3>
            <p className="text-gray-500 text-sm">
              {kind === "password"
                ? "Enter the password to continue."
                : "Enter your email to continue."}
            </p>
            {kind === "password" ? (
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="Password"
              />
            ) : (
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
            )}
            {state === "err" && (
              <p className="text-red-500 text-xs">That didn&apos;t work. Try again.</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={state === "submitting"}
                className="rounded-lg px-4 py-2 font-medium text-sm text-white disabled:opacity-50"
                style={{ background: accent ?? "#111" }}
              >
                {state === "submitting" ? "Checking…" : "Unlock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

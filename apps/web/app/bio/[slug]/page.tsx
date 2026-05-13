import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BioPageClient } from "./bio-page-client";

// `||` not `??` — `process.env` can be set to an empty string by env-passing
// shells (e.g. `${{ vars.X }}` in GH Actions when X is unset), and `??`
// would treat the empty string as a real value.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

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
  seoTitle: string | null;
  seoDescription: string | null;
  viewCount: number;
  hideBranding?: boolean;
  items: Array<{
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
  }>;
}

async function getGallery(slug: string): Promise<GalleryData | null> {
  try {
    // Galleries are stored against their canonical public domain (today
    // always "go2.gg"). On Cloudflare/OpenNext we cannot rely on the
    // request `host` header (it can be a *.workers.dev preview hostname),
    // so we always look up against the canonical app URL.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg";
    const domain = new URL(appUrl).host;
    const path = `/api/v1/public/galleries/${domain}/${slug}`;

    // Prefer the API service binding when running in the Cloudflare runtime
    // — calling api.go2.gg over the public network from a same-account
    // worker was returning 522s. Falls back to the public URL in dev.
    let response: Response;
    try {
      const { env } = getCloudflareContext();
      const apiBinding = (env as { API?: { fetch: typeof fetch } }).API;
      if (apiBinding?.fetch) {
        response = await apiBinding.fetch(`https://internal${path}`);
      } else {
        response = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
      }
    } catch {
      response = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    }

    if (!response.ok) {
      console.error("getGallery non-ok", { path, status: response.status });
      return null;
    }

    const result = (await response.json()) as { data?: GalleryData };
    if (!result?.data) {
      console.error("getGallery empty payload", { path });
    }
    return result.data ?? null;
  } catch (error) {
    console.error("getGallery threw", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) {
    return {
      title: "Not Found",
    };
  }

  const title = gallery.seoTitle || gallery.title || `@${gallery.slug}`;
  const description =
    gallery.seoDescription || gallery.bio || `Check out ${gallery.title || gallery.slug}'s links`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: gallery.avatarUrl ? [gallery.avatarUrl] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: gallery.avatarUrl ? [gallery.avatarUrl] : undefined,
    },
  };
}

export default async function BioPage({ params }: PageProps) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) {
    notFound();
  }

  return <BioPageClient gallery={gallery} />;
}

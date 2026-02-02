import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BioPageClient } from "./bio-page-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

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
  items: Array<{
    id: string;
    type: "link" | "header" | "divider" | "embed" | "image";
    title: string | null;
    url: string | null;
    thumbnailUrl: string | null;
    iconName: string | null;
    position: number;
    embedType: string | null;
    embedData: Record<string, unknown> | null;
  }>;
}

async function getGallery(slug: string): Promise<GalleryData | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "go2.gg";
    const domain = host.split(":")[0];

    const response = await fetch(`${API_URL}/api/v1/public/galleries/${domain}/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
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

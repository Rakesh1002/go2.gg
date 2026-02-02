"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { QRCustomizer, type QRStyle } from "@/components/qr/qr-customizer";
import { ArrowLeft, BarChart3, Pencil, QrCode } from "lucide-react";
import { toast } from "sonner";

interface LinkData {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title?: string;
  clickCount: number;
}

interface LinkQRClientProps {
  linkId: string;
}

export function LinkQRClient({ linkId }: LinkQRClientProps) {
  const router = useRouter();
  const [link, setLink] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle style changes from QR customizer (for future download functionality)
  const handleStyleChange = useCallback((_style: QRStyle) => {
    // Style can be used for download/export functionality
  }, []);

  useEffect(() => {
    async function fetchLink() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const response = await fetch(`${apiUrl}/api/v1/links/${linkId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Link not found");
          } else {
            throw new Error("Failed to fetch link");
          }
          return;
        }

        const result = await response.json();
        setLink(result.data);
      } catch (err) {
        console.error("Error fetching link:", err);
        setError("Failed to load link");
        toast.error("Failed to load link");
      } finally {
        setLoading(false);
      }
    }

    fetchLink();
  }, [linkId]);

  if (loading) {
    return <LinkQRSkeleton />;
  }

  if (error || !link) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <QrCode className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{error || "Link not found"}</h3>
        <p className="text-muted-foreground mb-4">
          The link you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => router.push("/dashboard/links")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Links
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/links")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">QR Code</h1>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                {link.shortUrl}
              </a>
              <CopyButton value={link.shortUrl} className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/links/${linkId}`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/links/${linkId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* QR Customizer */}
      <Card>
        <CardHeader>
          <CardTitle>Customize QR Code</CardTitle>
          <CardDescription>
            Customize the appearance of your QR code and download it in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QRCustomizer url={link.shortUrl} onStyleChange={handleStyleChange} />
        </CardContent>
      </Card>
    </div>
  );
}

function LinkQRSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* QR Card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <Skeleton className="h-64 w-64 mx-auto lg:mx-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

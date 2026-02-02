/**
 * Cloaked Link Page
 *
 * This page displays the destination URL in an iframe while keeping
 * the short link URL visible in the browser address bar.
 *
 * Features:
 * - URL masking (cloaking)
 * - Custom OG metadata
 * - Loading state
 * - Error handling
 */

import type { Metadata } from "next";

interface CloakedPageProps {
  params: Promise<{ url: string }>;
}

export async function generateMetadata({ params }: CloakedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedUrl = decodeURIComponent(resolvedParams.url);

  // Try to extract domain for title
  let domain = "Link";
  try {
    const urlObj = new URL(decodedUrl);
    domain = urlObj.hostname;
  } catch {
    // Invalid URL, use default
  }

  return {
    title: domain,
    description: "Redirecting to your destination",
  };
}

export default async function CloakedPage({ params }: CloakedPageProps) {
  const resolvedParams = await params;
  const decodedUrl = decodeURIComponent(resolvedParams.url);

  // Validate URL
  let isValidUrl = false;
  try {
    new URL(decodedUrl);
    isValidUrl = true;
  } catch {
    isValidUrl = false;
  }

  if (!isValidUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">The destination URL is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading overlay that fades out */}
      <div
        id="loading-overlay"
        className="fixed inset-0 bg-background flex items-center justify-center z-50 transition-opacity duration-500"
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>

      {/* Full-screen iframe */}
      <iframe
        src={decodedUrl}
        className="fixed inset-0 w-full h-full border-0"
        title="Destination"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => {
          // Hide loading overlay when iframe loads
          const overlay = document.getElementById("loading-overlay");
          if (overlay) {
            overlay.style.opacity = "0";
            setTimeout(() => {
              overlay.style.display = "none";
            }, 500);
          }
        }}
      />

      {/* Script to hide loading overlay */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              setTimeout(function() {
                var overlay = document.getElementById('loading-overlay');
                if (overlay) {
                  overlay.style.opacity = '0';
                  setTimeout(function() {
                    overlay.style.display = 'none';
                  }, 500);
                }
              }, 1000);
            });
          `,
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateLinkDialog } from "@/components/links";
import { Button } from "@/components/ui/button";

/**
 * Handles pending URLs from guest link creation.
 *
 * When a user creates a guest link on the landing page and then signs up,
 * we store the destination URL in sessionStorage. This component checks
 * for that URL and prompts the user to create a permanent link.
 */
export function PendingUrlHandler() {
  const searchParams = useSearchParams();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Check for pending URL from sessionStorage (guest link creation)
    const storedUrl = sessionStorage.getItem("go2_pending_url");

    // Also check URL params (for direct links)
    const urlParam = searchParams.get("url");

    const urlToUse = storedUrl || urlParam;

    if (urlToUse) {
      setPendingUrl(urlToUse);
      setDialogOpen(true);

      // Clean up sessionStorage
      if (storedUrl) {
        sessionStorage.removeItem("go2_pending_url");
      }
    }
  }, [searchParams]);

  if (!pendingUrl) return null;

  return (
    <CreateLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultUrl={pendingUrl}>
      {/* Hidden trigger - dialog opens automatically */}
      <Button className="hidden">Create Link</Button>
    </CreateLinkDialog>
  );
}

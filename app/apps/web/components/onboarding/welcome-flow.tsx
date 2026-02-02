"use client";

import { useState, useCallback } from "react";
import { WelcomeModal } from "./welcome-modal";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";

/**
 * WelcomeFlow coordinates the onboarding experience:
 * 1. Shows WelcomeModal for first-time users
 * 2. When user clicks "Create Your First Link", opens CreateLinkDialog
 */
export function WelcomeFlow() {
  const [createLinkOpen, setCreateLinkOpen] = useState(false);

  const handleCreateLink = useCallback(() => {
    setCreateLinkOpen(true);
  }, []);

  return (
    <>
      <WelcomeModal onCreateLink={handleCreateLink} />
      <CreateLinkDialog open={createLinkOpen} onOpenChange={setCreateLinkOpen} />
    </>
  );
}

"use client";

import { useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";

/**
 * Client wrapper for CommandPalette that handles the Create Link action
 */
export function CommandPaletteWrapper() {
  const [createLinkOpen, setCreateLinkOpen] = useState(false);

  return (
    <>
      <CommandPalette onCreateLink={() => setCreateLinkOpen(true)} />
      <CreateLinkDialog open={createLinkOpen} onOpenChange={setCreateLinkOpen} />
    </>
  );
}

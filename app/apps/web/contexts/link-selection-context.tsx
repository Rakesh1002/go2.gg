"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface LinkSelectionContextType {
  /** Whether selection mode is active */
  isSelectMode: boolean;
  /** Toggle selection mode on/off */
  setIsSelectMode: (value: boolean) => void;
  /** Array of selected link IDs */
  selectedLinkIds: string[];
  /** Set the selected link IDs */
  setSelectedLinkIds: (ids: string[]) => void;
  /** Toggle selection of a single link */
  toggleLinkSelection: (id: string) => void;
  /** Select all links from a given array */
  selectAll: (ids: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if a link is selected */
  isSelected: (id: string) => boolean;
}

const LinkSelectionContext = createContext<LinkSelectionContextType | undefined>(undefined);

export function LinkSelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

  const toggleLinkSelection = useCallback((id: string) => {
    setSelectedLinkIds((prev) =>
      prev.includes(id) ? prev.filter((linkId) => linkId !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedLinkIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLinkIds([]);
    setIsSelectMode(false);
  }, []);

  const isSelected = useCallback((id: string) => selectedLinkIds.includes(id), [selectedLinkIds]);

  return (
    <LinkSelectionContext.Provider
      value={{
        isSelectMode,
        setIsSelectMode,
        selectedLinkIds,
        setSelectedLinkIds,
        toggleLinkSelection,
        selectAll,
        clearSelection,
        isSelected,
      }}
    >
      {children}
    </LinkSelectionContext.Provider>
  );
}

export function useLinkSelection() {
  const context = useContext(LinkSelectionContext);
  if (!context) {
    throw new Error("useLinkSelection must be used within a LinkSelectionProvider");
  }
  return context;
}

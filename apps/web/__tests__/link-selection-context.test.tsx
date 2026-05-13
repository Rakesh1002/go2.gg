import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LinkSelectionProvider, useLinkSelection } from "@/contexts/link-selection-context";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <LinkSelectionProvider>{children}</LinkSelectionProvider>;
}

describe("useLinkSelection", () => {
  it("should start with empty selection", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    expect(result.current.selectedLinkIds).toEqual([]);
    expect(result.current.isSelectMode).toBe(false);
  });

  it("should toggle link selection", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    // Select a link
    act(() => {
      result.current.toggleLinkSelection("link-1");
    });

    expect(result.current.selectedLinkIds).toContain("link-1");

    // Deselect the same link
    act(() => {
      result.current.toggleLinkSelection("link-1");
    });

    expect(result.current.selectedLinkIds).not.toContain("link-1");
  });

  it("should select multiple links", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    act(() => {
      result.current.toggleLinkSelection("link-1");
      result.current.toggleLinkSelection("link-2");
      result.current.toggleLinkSelection("link-3");
    });

    expect(result.current.selectedLinkIds).toHaveLength(3);
    expect(result.current.selectedLinkIds).toContain("link-1");
    expect(result.current.selectedLinkIds).toContain("link-2");
    expect(result.current.selectedLinkIds).toContain("link-3");
  });

  it("should select all links", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    const allIds = ["link-1", "link-2", "link-3", "link-4"];

    act(() => {
      result.current.selectAll(allIds);
    });

    expect(result.current.selectedLinkIds).toEqual(allIds);
  });

  it("should clear selection", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    // Select some links
    act(() => {
      result.current.selectAll(["link-1", "link-2"]);
      result.current.setIsSelectMode(true);
    });

    expect(result.current.selectedLinkIds).toHaveLength(2);
    expect(result.current.isSelectMode).toBe(true);

    // Clear selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedLinkIds).toHaveLength(0);
    expect(result.current.isSelectMode).toBe(false);
  });

  it("should check if a link is selected", () => {
    const { result } = renderHook(() => useLinkSelection(), { wrapper });

    act(() => {
      result.current.toggleLinkSelection("link-1");
    });

    expect(result.current.isSelected("link-1")).toBe(true);
    expect(result.current.isSelected("link-2")).toBe(false);
  });

  it("should throw error when used outside provider", () => {
    // This test verifies the context throws when used without provider
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLinkSelection());
    }).toThrow("useLinkSelection must be used within a LinkSelectionProvider");

    consoleSpy.mockRestore();
  });
});

// Need to import vi for the last test
import { vi } from "vitest";

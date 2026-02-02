import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  KeyboardShortcutProvider,
  useKeyboardShortcut,
} from "@/contexts/keyboard-shortcut-context";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>;
}

describe("useKeyboardShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call callback when shortcut key is pressed", () => {
    const callback = vi.fn();

    renderHook(() => useKeyboardShortcut("c", callback), { wrapper });

    // Simulate key press
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "c" });
      document.dispatchEvent(event);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should not call callback when different key is pressed", () => {
    const callback = vi.fn();

    renderHook(() => useKeyboardShortcut("c", callback), { wrapper });

    // Simulate different key press
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "d" });
      document.dispatchEvent(event);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("should not call callback when disabled", () => {
    const callback = vi.fn();

    renderHook(() => useKeyboardShortcut("c", callback, { enabled: false }), {
      wrapper,
    });

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "c" });
      document.dispatchEvent(event);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle array of keys", () => {
    const callback = vi.fn();

    renderHook(() => useKeyboardShortcut(["c", "n"], callback), { wrapper });

    act(() => {
      const event1 = new KeyboardEvent("keydown", { key: "c" });
      document.dispatchEvent(event1);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      const event2 = new KeyboardEvent("keydown", { key: "n" });
      document.dispatchEvent(event2);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should allow Escape key even in input elements", () => {
    const callback = vi.fn();

    renderHook(() => useKeyboardShortcut("Escape", callback), { wrapper });

    // Create an input element and make it the target
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      input.dispatchEvent(event);
    });

    expect(callback).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToastWithUndo, toastWithUndo } from "@/hooks/use-toast-with-undo";

// Mock sonner toast
const mockToast = vi.fn();
vi.mock("sonner", () => ({
  toast: (content: unknown, options: unknown) => mockToast(content, options),
}));

describe("useToastWithUndo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a function", () => {
    const { result } = renderHook(() => useToastWithUndo());

    expect(typeof result.current).toBe("function");
  });

  it("should call toast with correct options", () => {
    const { result } = renderHook(() => useToastWithUndo());
    const undoFn = vi.fn();

    act(() => {
      result.current({
        id: "test-toast",
        message: "Item deleted",
        undo: undoFn,
      });
    });

    expect(mockToast).toHaveBeenCalled();
    const [, options] = mockToast.mock.calls[0];
    expect(options.id).toBe("test-toast");
    expect(options.duration).toBe(8000);
    expect(options.dismissible).toBe(true);
  });

  it("should use custom duration when provided", () => {
    const { result } = renderHook(() => useToastWithUndo());

    act(() => {
      result.current({
        id: "test-toast",
        message: "Item deleted",
        undo: vi.fn(),
        duration: 5000,
      });
    });

    const [, options] = mockToast.mock.calls[0];
    expect(options.duration).toBe(5000);
  });
});

describe("toastWithUndo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast directly without hook", () => {
    const undoFn = vi.fn();

    toastWithUndo({
      id: "direct-toast",
      message: "Direct message",
      undo: undoFn,
    });

    expect(mockToast).toHaveBeenCalled();
    const [, options] = mockToast.mock.calls[0];
    expect(options.id).toBe("direct-toast");
  });

  it("should use default duration of 8000ms", () => {
    toastWithUndo({
      id: "test",
      message: "Test",
      undo: vi.fn(),
    });

    const [, options] = mockToast.mock.calls[0];
    expect(options.duration).toBe(8000);
  });
});

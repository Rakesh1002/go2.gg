import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));

    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "initial" },
    });

    // Value should still be initial immediately after change
    rerender({ value: "updated" });
    expect(result.current).toBe("initial");

    // After 250ms, should still be initial
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe("initial");

    // After full delay, should be updated
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe("updated");
  });

  it("should reset timer on rapid changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "initial" },
    });

    // Change value multiple times
    rerender({ value: "first" });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: "third" });
    act(() => vi.advanceTimersByTime(200));

    // Should still be initial as timer keeps resetting
    expect(result.current).toBe("initial");

    // Wait for full delay after last change
    act(() => vi.advanceTimersByTime(300));

    // Should now be the last value
    expect(result.current).toBe("third");
  });

  it("should use default delay of 500ms", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial" },
    });

    rerender({ value: "updated" });

    // After 400ms, should still be initial
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("initial");

    // After 500ms total, should be updated
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("updated");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUpgradeBannerVisible } from "@/components/billing/upgrade-banner";

// Mock the subscription context
const mockUseSubscription = vi.fn();

vi.mock("@/contexts/subscription-context", () => ({
  useSubscription: () => mockUseSubscription(),
}));

describe("useUpgradeBannerVisible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show banner when loading", () => {
    mockUseSubscription.mockReturnValue({
      loading: true,
      subscription: { status: "active", plan: "free" },
      usage: null,
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(false);
    expect(result.current.limitInfo).toBeNull();
  });

  it("should show banner for past_due payment status", () => {
    mockUseSubscription.mockReturnValue({
      loading: false,
      subscription: { status: "past_due", plan: "pro" },
      usage: null,
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(true);
    expect(result.current.limitInfo?.type).toBe("payment");
    expect(result.current.limitInfo?.shortMessage).toBe("Payment failed");
  });

  it("should show banner when links limit exceeded", () => {
    mockUseSubscription.mockReturnValue({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { current: 25, limit: 25, percentage: 100 },
        trackedClicksThisMonth: { current: 100, limit: 1000, percentage: 10 },
        domains: { current: 0, limit: 1, percentage: 0 },
        teamMembers: { current: 1, limit: 1, percentage: 100 },
      },
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(true);
    expect(result.current.limitInfo?.type).toBe("links");
  });

  it("should show banner when clicks limit exceeded", () => {
    mockUseSubscription.mockReturnValue({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { current: 10, limit: 25, percentage: 40 },
        trackedClicksThisMonth: { current: 1000, limit: 1000, percentage: 100 },
        domains: { current: 0, limit: 1, percentage: 0 },
        teamMembers: { current: 1, limit: 1, percentage: 100 },
      },
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(true);
    expect(result.current.limitInfo?.type).toBe("clicks");
  });

  it("should show banner when domains limit exceeded", () => {
    mockUseSubscription.mockReturnValue({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { current: 10, limit: 25, percentage: 40 },
        trackedClicksThisMonth: { current: 500, limit: 1000, percentage: 50 },
        domains: { current: 1, limit: 1, percentage: 100 },
        teamMembers: { current: 1, limit: 1, percentage: 100 },
      },
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(true);
    expect(result.current.limitInfo?.type).toBe("domains");
  });

  it("should not show banner when under all limits", () => {
    mockUseSubscription.mockReturnValue({
      loading: false,
      subscription: { status: "active", plan: "pro" },
      usage: {
        linksThisMonth: { current: 10, limit: 100, percentage: 10 },
        trackedClicksThisMonth: { current: 500, limit: 10000, percentage: 5 },
        domains: { current: 2, limit: 10, percentage: 20 },
        teamMembers: { current: 3, limit: 10, percentage: 30 },
      },
    });

    const { result } = renderHook(() => useUpgradeBannerVisible());

    expect(result.current.visible).toBe(false);
    expect(result.current.limitInfo).toBeNull();
  });
});

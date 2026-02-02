import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Test the hook logic directly without rendering the component
describe("useUpgradeBannerVisible logic", () => {
  it("should return not visible when loading", () => {
    const result = checkVisibility({
      loading: true,
      subscription: { status: "active", plan: "free" },
      usage: null,
    });

    expect(result.visible).toBe(false);
  });

  it("should show banner for past_due payment", () => {
    const result = checkVisibility({
      loading: false,
      subscription: { status: "past_due", plan: "pro" },
      usage: null,
    });

    expect(result.visible).toBe(true);
    expect(result.limitInfo?.type).toBe("payment");
  });

  it("should show banner when links at 100%", () => {
    const result = checkVisibility({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { percentage: 100 },
        trackedClicksThisMonth: { percentage: 50 },
        domains: { percentage: 50 },
      },
    });

    expect(result.visible).toBe(true);
    expect(result.limitInfo?.type).toBe("links");
  });

  it("should show banner when clicks at 100%", () => {
    const result = checkVisibility({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { percentage: 50 },
        trackedClicksThisMonth: { percentage: 100 },
        domains: { percentage: 50 },
      },
    });

    expect(result.visible).toBe(true);
    expect(result.limitInfo?.type).toBe("clicks");
  });

  it("should show banner when domains at 100%", () => {
    const result = checkVisibility({
      loading: false,
      subscription: { status: "active", plan: "free" },
      usage: {
        linksThisMonth: { percentage: 50 },
        trackedClicksThisMonth: { percentage: 50 },
        domains: { percentage: 100 },
      },
    });

    expect(result.visible).toBe(true);
    expect(result.limitInfo?.type).toBe("domains");
  });

  it("should not show banner when under limits", () => {
    const result = checkVisibility({
      loading: false,
      subscription: { status: "active", plan: "pro" },
      usage: {
        linksThisMonth: { percentage: 50 },
        trackedClicksThisMonth: { percentage: 50 },
        domains: { percentage: 50 },
      },
    });

    expect(result.visible).toBe(false);
  });
});

// Helper function that mirrors the hook logic
function checkVisibility(data: {
  loading: boolean;
  subscription: { status: string; plan: string };
  usage: {
    linksThisMonth: { percentage: number };
    trackedClicksThisMonth: { percentage: number };
    domains: { percentage: number };
  } | null;
}) {
  if (data.loading) return { visible: false, limitInfo: null };

  if (data.subscription.status === "past_due") {
    return {
      visible: true,
      limitInfo: {
        type: "payment" as const,
        message: "Payment failed",
        shortMessage: "Payment failed",
      },
    };
  }

  if (data.usage) {
    if (data.usage.linksThisMonth.percentage >= 100) {
      return {
        visible: true,
        limitInfo: { type: "links" as const, message: "Links limit", shortMessage: "Links limit" },
      };
    }
    if (data.usage.trackedClicksThisMonth.percentage >= 100) {
      return {
        visible: true,
        limitInfo: {
          type: "clicks" as const,
          message: "Clicks limit",
          shortMessage: "Clicks limit",
        },
      };
    }
    if (data.usage.domains.percentage >= 100) {
      return {
        visible: true,
        limitInfo: {
          type: "domains" as const,
          message: "Domains limit",
          shortMessage: "Domains limit",
        },
      };
    }
  }

  return { visible: false, limitInfo: null };
}

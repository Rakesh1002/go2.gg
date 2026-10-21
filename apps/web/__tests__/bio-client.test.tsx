import { BioClient } from "@/app/(dashboard)/dashboard/bio/bio-client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/subscription-context", () => ({
  useSubscription: () => ({ subscription: { plan: "business" } }),
}));
vi.mock("@/hooks/use-queries", () => ({
  useDomains: () => ({ data: [{ domain: "mine.example", verificationStatus: "verified" }] }),
}));

const gallery = {
  id: "g1",
  slug: "me",
  domain: "go2.gg",
  url: "https://go2.gg/bio/me",
  title: "Me",
  bio: null,
  avatarUrl: null,
  theme: "default",
  themeConfig: null,
  socialLinks: [],
  isPublished: true,
  isSensitive: false,
  viewCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  items: [],
};

describe("BioClient settings", () => {
  it("enables the custom-domain picker and gates 18+ on the verified-domain rule", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const data = url.endsWith("/galleries") ? [gallery] : gallery;
      return new Response(JSON.stringify({ data }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BioClient />);
    await userEvent.click(await screen.findByRole("tab", { name: /settings/i }));

    // The "in setup" gate is gone; 18+ is now gated by the real domain rule.
    expect(screen.queryByText(/are in setup/)).toBeNull();
    expect(screen.getByText(/Move this page to a verified custom domain/)).toBeInTheDocument();

    // The domain picker is enabled now that custom bio domains are live.
    const domainPicker = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent === "go2.gg") as HTMLElement;
    expect(domainPicker).not.toBeDisabled();

    // 18+ stays disabled only because this page is still on the platform domain.
    const adultToggle = screen.getAllByRole("switch").at(-1) as HTMLElement;
    expect(adultToggle).toBeDisabled();
    vi.unstubAllGlobals();
  });
});

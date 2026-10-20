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
  it("keeps the custom-domain picker and 18+ toggle disabled while custom bio domains are in setup", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.method ?? "GET").toBe("GET");
      const data = url.endsWith("/galleries") ? [gallery] : gallery;
      return new Response(JSON.stringify({ data }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BioClient />);
    await userEvent.click(await screen.findByRole("tab", { name: /settings/i }));

    expect(screen.getByText(/Custom domains and 18\+ mode are in setup/)).toBeInTheDocument();
    const domainPicker = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent === "go2.gg") as HTMLElement;
    expect(domainPicker).toBeDisabled();
    const adultToggle = screen.getAllByRole("switch").at(-1) as HTMLElement;
    expect(adultToggle).toBeDisabled();

    await userEvent.click(adultToggle);
    await userEvent.click(domainPicker);
    expect(screen.queryByRole("option", { name: "mine.example" })).toBeNull();
    expect(fetchMock.mock.calls.every(([, init]) => (init?.method ?? "GET") === "GET")).toBe(true);
    vi.unstubAllGlobals();
  });
});

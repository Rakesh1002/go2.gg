import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShortLinkPreview } from "@/components/links/short-link-preview";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useDebounce to return value immediately
vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("ShortLinkPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for fetch - return not available
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { available: false } }),
    });
  });

  it("should render with default domain", () => {
    render(
      <ShortLinkPreview
        slug="test-slug"
        destinationUrl="https://example.com"
        checkAvailability={false}
      />
    );

    expect(screen.getByText("go2.gg/")).toBeInTheDocument();
    expect(screen.getByText("test-slug")).toBeInTheDocument();
  });

  it("should show placeholder when slug is empty", () => {
    render(
      <ShortLinkPreview slug="" destinationUrl="https://example.com" checkAvailability={false} />
    );

    expect(screen.getByText("your-slug")).toBeInTheDocument();
  });

  it("should display destination URL", () => {
    render(
      <ShortLinkPreview
        slug="test"
        destinationUrl="https://example.com/long/path"
        checkAvailability={false}
      />
    );

    expect(screen.getByText("→ https://example.com/long/path")).toBeInTheDocument();
  });

  it("should show copy button", () => {
    render(
      <ShortLinkPreview
        slug="test"
        destinationUrl="https://example.com"
        checkAvailability={false}
      />
    );

    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });

  it("should disable copy button when no destination URL", () => {
    render(<ShortLinkPreview slug="test" destinationUrl="" checkAvailability={false} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeDisabled();
  });

  it("should copy link to clipboard when copy button clicked", async () => {
    render(
      <ShortLinkPreview
        slug="my-link"
        destinationUrl="https://example.com"
        checkAvailability={false}
      />
    );

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://go2.gg/my-link");
  });

  it("should use custom domain when provided", () => {
    render(
      <ShortLinkPreview
        slug="test"
        destinationUrl="https://example.com"
        domain="custom.link"
        checkAvailability={false}
      />
    );

    expect(screen.getByText("custom.link/")).toBeInTheDocument();
  });

  it("should have preview label", () => {
    render(
      <ShortLinkPreview
        slug="test"
        destinationUrl="https://example.com"
        checkAvailability={false}
      />
    );

    expect(screen.getByText("Your short link preview")).toBeInTheDocument();
  });
});

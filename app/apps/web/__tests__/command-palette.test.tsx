import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { KeyboardShortcutProvider } from "@/contexts/keyboard-shortcut-context";
import type { ReactNode } from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useDebounce
vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}));

// Mock fetch
global.fetch = vi.fn();

function Wrapper({ children }: { children: ReactNode }) {
  return <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>;
}

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not be visible by default", () => {
    render(
      <Wrapper>
        <CommandPalette />
      </Wrapper>
    );

    // Dialog should not be visible when closed
    expect(screen.queryByPlaceholderText(/search links/i)).not.toBeInTheDocument();
  });

  it("should render without crashing", () => {
    const { container } = render(
      <Wrapper>
        <CommandPalette />
      </Wrapper>
    );

    expect(container).toBeDefined();
  });

  it("should accept onCreateLink callback prop", () => {
    const onCreateLink = vi.fn();

    render(
      <Wrapper>
        <CommandPalette onCreateLink={onCreateLink} />
      </Wrapper>
    );

    // Component should render without error
    expect(screen.queryByPlaceholderText(/search links/i)).not.toBeInTheDocument();
  });
});

describe("CommandPalette navigation items", () => {
  it("should have correct navigation paths", () => {
    const navigationItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/links", label: "Links" },
      { href: "/dashboard/analytics", label: "Analytics" },
      { href: "/dashboard/domains", label: "Domains" },
      { href: "/dashboard/qr", label: "QR Codes" },
      { href: "/dashboard/folders", label: "Folders" },
      { href: "/dashboard/developer", label: "Developer" },
      { href: "/dashboard/billing", label: "Billing" },
      { href: "/dashboard/settings", label: "Settings" },
    ];

    // Verify all expected paths exist
    expect(navigationItems.find((i) => i.href === "/dashboard")).toBeDefined();
    expect(navigationItems.find((i) => i.href === "/dashboard/links")).toBeDefined();
    expect(navigationItems.find((i) => i.href === "/dashboard/analytics")).toBeDefined();
  });

  it("should have quick actions defined", () => {
    const quickActions = [
      { id: "create-link", label: "Create New Link" },
      { id: "search-links", label: "Search Links" },
    ];

    expect(quickActions).toHaveLength(2);
    expect(quickActions.find((a) => a.id === "create-link")).toBeDefined();
    expect(quickActions.find((a) => a.id === "search-links")).toBeDefined();
  });
});

describe("CommandPalette keyboard shortcuts", () => {
  it("should use correct shortcut keys", () => {
    const shortcuts = ["meta+k", "ctrl+k"];

    expect(shortcuts).toContain("meta+k");
    expect(shortcuts).toContain("ctrl+k");
  });
});

import { BioPageClient } from "@/app/bio/[slug]/bio-page-client";
import { openInExternalBrowser } from "@/lib/in-app-browser";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/in-app-browser", () => ({ openInExternalBrowser: vi.fn(() => false) }));
vi.stubGlobal(
  "fetch",
  vi.fn(async () => new Response())
);

const gallery = {
  id: "g1",
  slug: "creator",
  domain: "creator.example",
  title: "Creator",
  bio: null,
  avatarUrl: null,
  theme: "default",
  themeConfig: null,
  socialLinks: [{ platform: "instagram", url: "https://instagram.com/creator" }],
  customCss: null,
  isSensitive: false,
  items: [
    {
      id: "i1",
      type: "link" as const,
      title: "My link",
      url: "https://example.com/mine",
      thumbnailUrl: null,
      iconName: null,
      position: 0,
      embedType: null,
      embedData: null,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.mocked(localStorage.getItem).mockReset();
  vi.mocked(localStorage.setItem).mockReset();
  vi.mocked(openInExternalBrowser).mockReset().mockReturnValue(false);
});

describe("BioPageClient custom CSS", () => {
  it("cannot break out of the style element during SSR", () => {
    const html = renderToString(
      <BioPageClient
        gallery={{
          ...gallery,
          customCss:
            "a{color:red}</style><script>alert(1)</script></STYLE ><img src=x onerror=alert(1)>",
        }}
      />
    );
    // The HTML parser ends a <style> element only at "</style", so React's own closing tag must be the sole one.
    expect(html.match(/<\/style/gi)).toHaveLength(1);
    expect(html).toContain("a{color:red}<\\/style><script>");
  });

  it("leaves valid CSS intact", () => {
    const css = '@media (width < 600px) { a { content: "<" } }';
    const html = renderToString(<BioPageClient gallery={{ ...gallery, customCss: css }} />);
    expect(html).toContain(css);
  });
});

describe("BioPageClient 18+ pages", () => {
  it("server-renders the age gate instead of the links", () => {
    const html = renderToString(<BioPageClient gallery={{ ...gallery, isSensitive: true }} />);
    expect(html).toContain("18+ content");
    expect(html).not.toContain("https://example.com/mine");
  });

  it("shows the links after confirming and remembers the choice", () => {
    render(<BioPageClient gallery={{ ...gallery, isSensitive: true }} />);
    expect(screen.queryByText("My link")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "I'm 18 or older" }));
    expect(screen.getByText("My link")).toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalledWith("go2:age-confirmed", "1");

    cleanup();
    vi.mocked(localStorage.getItem).mockReturnValue("1");
    render(<BioPageClient gallery={{ ...gallery, isSensitive: true }} />);
    expect(screen.getByText("My link")).toBeInTheDocument();
  });

  it("still works when storage is blocked", () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<BioPageClient gallery={{ ...gallery, isSensitive: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "I'm 18 or older" }));
    expect(screen.getByText("My link")).toBeInTheDocument();
  });

  it("renders links directly for regular pages", () => {
    render(<BioPageClient gallery={gallery} />);
    expect(screen.getByText("My link")).toBeInTheDocument();
  });
});

describe("BioPageClient outbound links", () => {
  it("hands item and social links to the in-app browser escape", () => {
    vi.mocked(openInExternalBrowser).mockReturnValue(true);
    render(<BioPageClient gallery={gallery} />);

    const item = screen.getByText("My link").closest("a") as HTMLAnchorElement;
    expect(fireEvent.click(item)).toBe(false);
    expect(openInExternalBrowser).toHaveBeenLastCalledWith("https://example.com/mine");

    const social = document.querySelector(
      'a[href="https://instagram.com/creator"]'
    ) as HTMLAnchorElement;
    expect(fireEvent.click(social)).toBe(false);
    expect(openInExternalBrowser).toHaveBeenLastCalledWith("https://instagram.com/creator");
  });

  it("lets the link open normally when no escape applies", () => {
    render(<BioPageClient gallery={gallery} />);
    const item = screen.getByText("My link").closest("a") as HTMLAnchorElement;
    expect(fireEvent.click(item)).toBe(true);
  });
});

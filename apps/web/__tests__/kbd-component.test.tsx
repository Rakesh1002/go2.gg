import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd } from "@/contexts/keyboard-shortcut-context";

describe("Kbd component", () => {
  it("should render children", () => {
    render(<Kbd>Ctrl</Kbd>);

    expect(screen.getByText("Ctrl")).toBeInTheDocument();
  });

  it("should have keyboard styling", () => {
    render(<Kbd>K</Kbd>);

    const kbd = screen.getByText("K");
    expect(kbd.tagName).toBe("KBD");
  });

  it("should apply custom className", () => {
    render(<Kbd className="custom-class">Enter</Kbd>);

    const kbd = screen.getByText("Enter");
    expect(kbd).toHaveClass("custom-class");
  });

  it("should have monospace font", () => {
    render(<Kbd>⌘</Kbd>);

    const kbd = screen.getByText("⌘");
    expect(kbd).toHaveClass("font-mono");
  });

  it("should render multiple keys", () => {
    render(
      <div>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </div>
    );

    expect(screen.getByText("⌘")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
  });
});

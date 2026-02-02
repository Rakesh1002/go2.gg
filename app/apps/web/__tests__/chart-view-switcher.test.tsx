import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartViewSwitcher, type ChartViewType } from "@/components/analytics/chart-view-switcher";

describe("ChartViewSwitcher", () => {
  it("should render all view options", () => {
    const onChange = vi.fn();
    render(<ChartViewSwitcher value="area" onChange={onChange} />);

    // Check that all toggle buttons are rendered (by checking for 3 buttons)
    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(3);
  });

  it("should highlight the selected view", () => {
    const onChange = vi.fn();
    render(<ChartViewSwitcher value="bar" onChange={onChange} />);

    const barButton = screen.getByRole("radio", { name: /bar chart/i });
    expect(barButton).toHaveAttribute("data-state", "on");
  });

  it("should call onChange when a view is selected", () => {
    const onChange = vi.fn();
    render(<ChartViewSwitcher value="area" onChange={onChange} />);

    const barButton = screen.getByRole("radio", { name: /bar chart/i });
    fireEvent.click(barButton);

    expect(onChange).toHaveBeenCalledWith("bar");
  });

  it("should not call onChange when clicking already selected view", () => {
    const onChange = vi.fn();
    render(<ChartViewSwitcher value="area" onChange={onChange} />);

    const areaButton = screen.getByRole("radio", { name: /area chart/i });
    fireEvent.click(areaButton);

    // ToggleGroup with type="single" doesn't allow deselection by default
    // so clicking the same option won't trigger onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChartViewSwitcher value="area" onChange={onChange} className="custom-class" />
    );

    const toggleGroup = container.firstChild;
    expect(toggleGroup).toHaveClass("custom-class");
  });
});

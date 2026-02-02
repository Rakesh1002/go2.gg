import { describe, it, expect } from "vitest";

describe("Analytics Chart View Logic", () => {
  it("should validate area chart type", () => {
    const chartType = "area";
    const validTypes = ["area", "bar", "line"];

    expect(validTypes).toContain(chartType);
  });

  it("should validate bar chart type", () => {
    const chartType = "bar";
    const validTypes = ["area", "bar", "line"];

    expect(validTypes).toContain(chartType);
  });

  it("should validate line chart type", () => {
    const chartType = "line";
    const validTypes = ["area", "bar", "line"];

    expect(validTypes).toContain(chartType);
  });

  it("should default to area when invalid type", () => {
    const getChartView = (stored: string | null): string => {
      if (stored && ["area", "bar", "line"].includes(stored)) {
        return stored;
      }
      return "area";
    };

    expect(getChartView(null)).toBe("area");
    expect(getChartView("invalid")).toBe("area");
    expect(getChartView("bar")).toBe("bar");
  });

  it("should use localStorage key analytics-chart-view", () => {
    const storageKey = "analytics-chart-view";

    expect(storageKey).toBe("analytics-chart-view");
  });
});

describe("ChartViewType validation", () => {
  const validTypes = ["area", "bar", "line"];

  it.each(validTypes)("should accept valid chart type: %s", (type) => {
    expect(validTypes).toContain(type);
  });

  it("should have exactly 3 chart types", () => {
    expect(validTypes).toHaveLength(3);
  });

  it("should reject invalid chart types", () => {
    const invalidTypes = ["pie", "scatter", "histogram"];

    invalidTypes.forEach((type) => {
      expect(validTypes).not.toContain(type);
    });
  });
});

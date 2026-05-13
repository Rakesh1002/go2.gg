"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../primitives/card";

interface BarChartProps {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  layout?: "horizontal" | "vertical";
}

export function BarChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  color = "hsl(var(--primary))",
  height = 300,
  showGrid = true,
  showTooltip = true,
  formatValue,
  layout = "horizontal",
}: BarChartProps) {
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data} layout={layout}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis
              dataKey={layout === "horizontal" ? xAxisKey : undefined}
              type={layout === "horizontal" ? "category" : "number"}
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
              tickFormatter={layout === "vertical" ? formatValue : undefined}
            />
            <YAxis
              dataKey={layout === "vertical" ? xAxisKey : undefined}
              type={layout === "vertical" ? "category" : "number"}
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
              tickFormatter={layout === "horizontal" ? formatValue : undefined}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) =>
                  formatValue ? [formatValue(value), dataKey] : [value, dataKey]
                }
              />
            )}
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

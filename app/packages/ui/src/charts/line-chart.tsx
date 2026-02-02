"use client";

import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../primitives/card";

interface LineConfig {
  dataKey: string;
  color: string;
  label?: string;
  strokeWidth?: number;
  dot?: boolean;
}

interface LineChartProps {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export function LineChart({
  title,
  description,
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatValue,
}: LineChartProps) {
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
          <RechartsLineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
              tickFormatter={formatValue}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            )}
            {showLegend && <Legend />}
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.label || line.dataKey}
                stroke={line.color}
                strokeWidth={line.strokeWidth ?? 2}
                dot={line.dot ?? false}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

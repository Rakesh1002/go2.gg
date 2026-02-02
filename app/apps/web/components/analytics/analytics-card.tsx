"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Maximize2, ExternalLink } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SubTab {
  id: string;
  label: string;
}

interface AnalyticsCardProps {
  /** Card title */
  title?: string;
  /** Tabs to display at the top */
  tabs?: Tab[];
  /** Currently active tab */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tab: string) => void;
  /** Sub-tabs (toggle group) below main tabs */
  subTabs?: SubTab[];
  /** Currently active sub-tab */
  activeSubTab?: string;
  /** Callback when sub-tab changes */
  onSubTabChange?: (subTab: string) => void;
  /** Event type indicator */
  eventType?: "clicks" | "leads" | "sales" | "custom";
  /** Custom event type label */
  eventTypeLabel?: string;
  /** Show expand button */
  expandable?: boolean;
  /** Modal content when expanded */
  expandedContent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Show gradient fade at bottom */
  showFade?: boolean;
  /** Max height before scrolling */
  maxHeight?: number;
  /** Card content */
  children?: React.ReactNode;
  className?: string;
}

const eventTypeColors = {
  clicks: "bg-blue-500",
  leads: "bg-purple-500",
  sales: "bg-green-500",
  custom: "bg-gray-500",
};

export function AnalyticsCard({
  title,
  tabs,
  activeTab,
  onTabChange,
  subTabs,
  activeSubTab,
  onSubTabChange,
  eventType,
  eventTypeLabel,
  expandable = false,
  expandedContent,
  loading = false,
  showFade = true,
  maxHeight = 300,
  children,
  className,
}: AnalyticsCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {eventType && (
              <div className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", eventTypeColors[eventType])} />
                <span className="text-xs text-muted-foreground capitalize">
                  {eventTypeLabel || eventType}
                </span>
              </div>
            )}
          </div>

          {expandable && (
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{title || "View All"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">{expandedContent || children}</ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <Tabs value={activeTab} onValueChange={onTabChange} className="mt-2">
            <TabsList className="h-8 p-0.5">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="h-7 gap-1.5 text-xs">
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Sub-tabs */}
        {subTabs && subTabs.length > 0 && (
          <ToggleGroup
            type="single"
            value={activeSubTab}
            onValueChange={onSubTabChange}
            className="mt-2 justify-start"
          >
            {subTabs.map((subTab) => (
              <ToggleGroupItem key={subTab.id} value={subTab.id} size="sm" className="h-7 text-xs">
                {subTab.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </CardHeader>

      <CardContent className="relative pb-4">
        <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight}px` }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded bg-muted animate-pulse"
                    style={{ width: `${100 - i * 15}%` }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gradient fade at bottom */}
        {showFade && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
        )}
      </CardContent>
    </Card>
  );
}

interface BarListItem {
  name: string;
  value: number;
  href?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface BarListProps {
  /** Data items to display */
  data: BarListItem[];
  /** Value formatter function */
  valueFormatter?: (value: number) => string;
  /** Bar color (uses Tailwind bg class) */
  barColor?: string;
  /** Show rank numbers */
  showRank?: boolean;
  /** Click handler for items */
  onItemClick?: (item: BarListItem) => void;
  className?: string;
}

export function BarList({
  data,
  valueFormatter = (v) => v.toLocaleString(),
  barColor = "bg-primary/20",
  showRank = false,
  onItemClick,
  className,
}: BarListProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-2", className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;

        const content = (
          <div
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-2 py-1.5",
              "hover:bg-muted/50 transition-colors cursor-pointer"
            )}
            onClick={() => onItemClick?.(item)}
          >
            {/* Background bar */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-md transition-all",
                item.color || barColor
              )}
              style={{ width: `${percentage}%` }}
            />

            {/* Content */}
            <div className="relative flex flex-1 items-center gap-2 min-w-0">
              {showRank && (
                <span className="w-5 text-xs text-muted-foreground font-medium">{index + 1}</span>
              )}
              {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
              <span className="truncate text-sm font-medium">{item.name}</span>
              {item.href && (
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>

            <span className="relative text-sm font-medium tabular-nums">
              {valueFormatter(item.value)}
            </span>
          </div>
        );

        if (item.href) {
          return (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        }

        return <div key={item.name}>{content}</div>;
      })}
    </div>
  );
}

interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  /** Center label */
  centerLabel?: string;
  /** Center value */
  centerValue?: string | number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  className?: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 120,
  strokeWidth = 12,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {data.map((segment) => {
          const segmentPercentage = segment.value / total;
          const strokeDasharray = `${segmentPercentage * circumference} ${circumference}`;
          const strokeDashoffset = -offset * circumference;
          offset += segmentPercentage;

          return (
            <circle
              key={segment.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Center content */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && <span className="text-xl font-bold">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SpeedData {
  name: string;
  time: number;
  description: string;
}

const competitors: SpeedData[] = [
  { name: "Go2", time: 8, description: "Optimized for global latency" },
  { name: "Dub.co", time: 45, description: "Modern link management platform" },
  { name: "Short.io", time: 85, description: "White-label URL shortener" },
  { name: "Bitly", time: 120, description: "Popular enterprise solution" },
  { name: "TinyURL", time: 200, description: "Classic URL shortening service" },
];

export function SpeedComparison() {
  const [isVisible, setIsVisible] = useState(false);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Slight delay before animating bars for better visual effect
          setTimeout(() => setAnimated(true), 200);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const maxTime = Math.max(...competitors.map((c) => c.time));
  const go2Time = competitors.find((c) => c.name === "Go2")?.time || 8;
  const slowestCompetitor = competitors.reduce((a, b) => (a.time > b.time ? a : b));
  const speedMultiplier = Math.round(slowestCompetitor.time / go2Time);

  return (
    <div ref={ref} className="mx-auto max-w-3xl">
      <div className="space-y-4">
        {competitors.map((competitor, index) => {
          const percentage = (competitor.time / maxTime) * 100;
          const isGo2 = competitor.name === "Go2";

          return (
            <Tooltip key={competitor.name}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "cursor-default rounded-xl p-4 transition-all duration-500",
                    isGo2
                      ? "border-2 border-[var(--marketing-accent)] bg-[var(--marketing-accent)]/5 shadow-[var(--marketing-accent)]/10 shadow-lg"
                      : "border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] hover:border-[var(--marketing-border)]/80",
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}
                  style={{
                    transitionDelay: `${index * 80}ms`,
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isGo2 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--marketing-accent)] text-white shadow-md">
                          <Trophy className="h-4 w-4" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-bold text-lg transition-colors",
                          isGo2 ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"
                        )}
                      >
                        {competitor.name}
                      </span>
                      {isGo2 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--marketing-accent)] px-3 py-1 font-bold text-white text-xs shadow-md">
                          <Zap className="h-3 w-3" />
                          {speedMultiplier}x Faster
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-mono text-lg tabular-nums",
                        isGo2
                          ? "font-extrabold text-[var(--marketing-accent)]"
                          : "text-[var(--marketing-text-muted)]"
                      )}
                    >
                      {animated ? (
                        <AnimatedCounter
                          value={competitor.time}
                          duration={800}
                          delay={index * 100}
                        />
                      ) : (
                        0
                      )}
                      <span className="ml-0.5 text-sm">ms</span>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--marketing-border)]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        isGo2
                          ? "bg-[var(--marketing-accent)]"
                          : "bg-[var(--marketing-text-muted)]/30"
                      )}
                      style={{
                        width: animated ? `${percentage}%` : "0%",
                        transitionDelay: `${index * 100 + 200}ms`,
                      }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p>{competitor.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-10 text-center transition-all duration-500",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{ transitionDelay: "600ms" }}
      >
        <p className="mx-auto max-w-lg text-[var(--marketing-text-muted)] text-sm">
          Median redirect times measured from multiple global locations. Go2 delivers
          sub-10ms redirects worldwide.
        </p>
      </div>
    </div>
  );
}

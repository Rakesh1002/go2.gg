"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "framer-motion";

interface ReadingProgressProps {
  className?: string;
  /** Target element to track (defaults to document) */
  target?: React.RefObject<HTMLElement>;
}

/**
 * Reading progress bar that shows how far through the content the user has scrolled
 */
export function ReadingProgress({ className, target }: ReadingProgressProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: target,
    offset: ["start start", "end end"],
  });

  // Smooth spring animation for the progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Only show after scrolling a bit
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--marketing-bg-elevated)]",
        className
      )}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] origin-left"
        style={{ scaleX }}
      />
    </div>
  );
}

/**
 * Alternative reading progress as a circular indicator
 */
export function CircularProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (progress < 5) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="relative h-12 w-12 bg-white rounded-full shadow-lg border border-[var(--marketing-border)]">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--marketing-border)"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--marketing-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-150"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[var(--marketing-text)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

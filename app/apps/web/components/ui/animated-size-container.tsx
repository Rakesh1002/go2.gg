"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Easing } from "framer-motion";
import { cn } from "@/lib/utils";

type EasingValue = Easing | Easing[];

interface AnimatedSizeContainerProps {
  children?: React.ReactNode;
  className?: string;
  /** Width to animate to. If undefined, width is auto. */
  width?: number | "auto";
  /** Height to animate to. If undefined, height is auto. */
  height?: number | "auto";
  /** Animation duration in seconds */
  duration?: number;
  /** Animation easing */
  ease?: EasingValue;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Transition configuration */
  transition?: {
    duration?: number;
    ease?: EasingValue;
    type?: "spring" | "tween";
    stiffness?: number;
    damping?: number;
  };
}

/**
 * A container that smoothly animates its size changes.
 * Useful for content that changes dynamically (accordion, tabs, etc.)
 */
export function AnimatedSizeContainer({
  children,
  className,
  width,
  height,
  duration = 0.3,
  ease = "easeInOut",
  animateOnMount = false,
  transition,
}: AnimatedSizeContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setSize({ width: w, height: h });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const defaultTransition = {
    duration,
    ease,
    ...transition,
  };

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      animate={{
        width: width !== undefined ? width : size?.width,
        height: height !== undefined ? height : size?.height,
      }}
      initial={animateOnMount ? { width: 0, height: 0 } : false}
      transition={defaultTransition}
    >
      <div ref={containerRef} className="w-fit">
        {children}
      </div>
    </motion.div>
  );
}

interface AnimatedHeightContainerProps {
  children?: React.ReactNode;
  className?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Transition configuration */
  transition?: {
    duration?: number;
    ease?: EasingValue;
    type?: "spring" | "tween";
    stiffness?: number;
    damping?: number;
  };
}

/**
 * A container that smoothly animates height changes only.
 * More commonly used than full AnimatedSizeContainer.
 */
export function AnimatedHeightContainer({
  children,
  className,
  duration = 0.3,
  animateOnMount = false,
  transition,
}: AnimatedHeightContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const defaultTransition = {
    duration,
    ease: "easeInOut" as const,
    ...transition,
  };

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      animate={{ height }}
      initial={animateOnMount ? { height: 0 } : false}
      transition={defaultTransition}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}

interface AnimatedPresenceContainerProps {
  children: React.ReactNode;
  /** Key for the current content - when it changes, content animates out/in */
  contentKey: string | number;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation mode */
  mode?: "wait" | "sync" | "popLayout";
  className?: string;
}

/**
 * A container that animates content in and out when content changes.
 * Uses a key to determine when to animate transitions.
 */
export function AnimatedPresenceContainer({
  children,
  contentKey,
  duration = 0.2,
  mode = "wait",
  className,
}: AnimatedPresenceContainerProps) {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={contentKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * A simple fade in/out container
 */
export function FadeContainer({
  children,
  className,
  show = true,
  duration = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
  duration?: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState, useRef, type RefObject } from "react";

interface UseInViewOptions {
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Root margin */
  rootMargin?: string;
  /** Only trigger once */
  triggerOnce?: boolean;
  /** Initial state (for SSR) */
  initialInView?: boolean;
  /** Delay before setting inView to true (ms) */
  delay?: number;
}

interface UseInViewReturn {
  ref: RefObject<HTMLElement | null>;
  isInView: boolean;
  hasTriggered: boolean;
}

export function useInView({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  initialInView = false,
  delay = 0,
}: UseInViewOptions = {}): UseInViewReturn {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(initialInView);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsInView(true);
      setHasTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsInView(true);
              setHasTriggered(true);
            }, delay);
          } else {
            setIsInView(true);
            setHasTriggered(true);
          }

          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, delay]);

  return { ref, isInView, hasTriggered };
}

/** Hook for staggered animation of multiple children */
interface UseStaggeredInViewOptions extends UseInViewOptions {
  /** Number of items */
  count: number;
  /** Delay between each item (ms) */
  staggerDelay?: number;
}

interface UseStaggeredInViewReturn extends UseInViewReturn {
  getStaggerDelay: (index: number) => number;
  isItemInView: (index: number) => boolean;
}

export function useStaggeredInView({
  count,
  staggerDelay = 100,
  ...options
}: UseStaggeredInViewOptions): UseStaggeredInViewReturn {
  const { ref, isInView, hasTriggered } = useInView(options);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isInView) {
      const timeouts: NodeJS.Timeout[] = [];

      for (let i = 0; i < count; i++) {
        const timeout = setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, i]));
        }, i * staggerDelay);
        timeouts.push(timeout);
      }

      return () => timeouts.forEach(clearTimeout);
    }
  }, [isInView, count, staggerDelay]);

  return {
    ref,
    isInView,
    hasTriggered,
    getStaggerDelay: (index: number) => index * staggerDelay,
    isItemInView: (index: number) => visibleItems.has(index),
  };
}

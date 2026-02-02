"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "none";

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation type */
  animation?: AnimationType;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms) */
  duration?: number;
  /** Threshold for intersection */
  threshold?: number;
  /** Custom initial styles */
  initialStyles?: React.CSSProperties;
  /** Custom animated styles */
  animatedStyles?: React.CSSProperties;
  /** HTML element to render */
  as?: React.ElementType;
}

const animationConfig: Record<
  AnimationType,
  {
    initial: React.CSSProperties;
    animated: React.CSSProperties;
  }
> = {
  "fade-up": {
    initial: { opacity: 0, transform: "translateY(30px)" },
    animated: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-down": {
    initial: { opacity: 0, transform: "translateY(-30px)" },
    animated: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-left": {
    initial: { opacity: 0, transform: "translateX(-30px)" },
    animated: { opacity: 1, transform: "translateX(0)" },
  },
  "fade-right": {
    initial: { opacity: 0, transform: "translateX(30px)" },
    animated: { opacity: 1, transform: "translateX(0)" },
  },
  scale: {
    initial: { opacity: 0, transform: "scale(0.95)" },
    animated: { opacity: 1, transform: "scale(1)" },
  },
  none: {
    initial: {},
    animated: {},
  },
};

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 500,
  threshold = 0.1,
  initialStyles,
  animatedStyles,
  as: Component = "div",
  style,
  ...props
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({
    threshold,
    triggerOnce: true,
    delay,
  });

  const config = animationConfig[animation];
  const currentStyles = isInView
    ? { ...config.animated, ...animatedStyles }
    : { ...config.initial, ...initialStyles };

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn("transition-all", className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        ...currentStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Container for staggered children animations */
interface StaggeredContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay between each child (ms) */
  staggerDelay?: number;
  /** Base animation delay (ms) */
  baseDelay?: number;
  /** Animation type for children */
  animation?: AnimationType;
  /** Duration for each child animation (ms) */
  duration?: number;
}

export function StaggeredContainer({
  children,
  className,
  staggerDelay = 100,
  baseDelay = 0,
  animation = "fade-up",
  duration = 400,
  ...props
}: StaggeredContainerProps) {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });

  const config = animationConfig[animation];

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const delay = baseDelay + index * staggerDelay;
        const currentStyles = isInView ? config.animated : config.initial;

        return (
          <div
            style={{
              transitionDuration: `${duration}ms`,
              transitionDelay: `${delay}ms`,
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionProperty: "opacity, transform",
              ...currentStyles,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

/** Parallax effect wrapper */
interface ParallaxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Parallax intensity (-1 to 1, negative moves opposite) */
  intensity?: number;
  /** Direction of parallax */
  direction?: "vertical" | "horizontal";
}

export function Parallax({
  children,
  className,
  intensity = 0.2,
  direction = "vertical",
  style,
  ...props
}: ParallaxProps) {
  const [offset, setOffset] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate how far through the viewport the element is
      const progress = (windowHeight - elementTop) / (windowHeight + elementHeight);
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Calculate offset based on progress and intensity
      const maxOffset = 100 * intensity;
      setOffset((clampedProgress - 0.5) * 2 * maxOffset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [intensity]);

  const transform =
    direction === "vertical" ? `translateY(${offset}px)` : `translateX(${offset}px)`;

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        transform,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gradientTextVariants = cva("bg-clip-text text-transparent", {
  variants: {
    variant: {
      brand: "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%]",
      primary: "bg-gradient-to-r from-primary to-primary/70",
      secondary: "bg-gradient-to-r from-secondary to-secondary/70",
      rainbow:
        "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-[length:300%_100%]",
      sunrise: "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500",
      ocean: "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
      forest: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500",
      fire: "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500",
    },
    animate: {
      true: "animate-gradient",
      false: "",
    },
  },
  defaultVariants: {
    variant: "brand",
    animate: false,
  },
});

interface GradientTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientTextVariants> {
  /** HTML element to render */
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
}

export function GradientText({
  children,
  className,
  variant,
  animate,
  as: Component = "span",
  ...props
}: GradientTextProps) {
  return (
    <Component className={cn(gradientTextVariants({ variant, animate }), className)} {...props}>
      {children}
    </Component>
  );
}

/** Animated typing text with gradient */
interface TypewriterTextProps extends GradientTextProps {
  /** Full text to type */
  text: string;
  /** Typing speed in ms per character */
  speed?: number;
  /** Delay before starting (ms) */
  delay?: number;
  /** Show cursor */
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  showCursor = true,
  className,
  ...props
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let index = 0;

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);

  return (
    <GradientText className={className} {...props}>
      {displayText}
      {showCursor && (
        <span
          className={cn(
            "inline-block w-[2px] h-[1em] ml-0.5 bg-current align-middle",
            isTyping ? "animate-pulse" : "opacity-0"
          )}
        />
      )}
    </GradientText>
  );
}

export { gradientTextVariants };

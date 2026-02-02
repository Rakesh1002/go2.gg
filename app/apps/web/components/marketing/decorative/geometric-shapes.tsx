"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GeometricShapesProps {
  className?: string;
  position?: "hero-right" | "hero-left" | "section-left" | "section-right" | "center";
}

export function GeometricShapes({ className, position = "hero-right" }: GeometricShapesProps) {
  const isRight = position.includes("right");

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Main floating elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={cn(
          "absolute top-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-[var(--marketing-accent)]/5",
          isRight ? "-right-20" : "-left-20"
        )}
      />

      {/* Animated Square Outline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 0.4,
          scale: 1,
          rotate: [0, 90, 180, 270, 360],
          y: [0, -20, 0],
        }}
        transition={{
          opacity: { duration: 1, delay: 0.5 },
          scale: { duration: 1, delay: 0.5 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className={cn(
          "absolute w-64 h-64 border border-[var(--marketing-accent)]/20 rounded-[2rem]",
          isRight ? "top-20 right-10" : "top-20 left-10"
        )}
      />

      {/* Floating Circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 0.6,
          scale: 1,
          y: [0, 30, 0],
          x: [0, 15, 0],
        }}
        transition={{
          opacity: { duration: 1, delay: 0.8 },
          scale: { duration: 1, delay: 0.8 },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className={cn(
          "absolute w-24 h-24 rounded-full border border-[var(--marketing-accent-light)]/30 bg-[var(--marketing-accent)]/5 backdrop-blur-sm",
          isRight ? "top-60 right-60" : "top-60 left-60"
        )}
      />

      {/* Decorative Dots Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className={cn("absolute top-1/2 w-48 h-48", isRight ? "right-0" : "left-0")}
        style={{
          backgroundImage: "radial-gradient(circle, var(--marketing-accent) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Morphing Shape */}
      <motion.div
        animate={{
          borderRadius: [
            "60% 40% 30% 70%/60% 30% 70% 40%",
            "30% 60% 70% 40%/50% 60% 30% 60%",
            "60% 40% 30% 70%/60% 30% 70% 40%",
          ],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute w-96 h-96 bg-[var(--marketing-accent)]/5 mix-blend-overlay blur-3xl",
          isRight ? "bottom-0 right-20" : "bottom-0 left-20"
        )}
      />

      {/* Small accent elements */}
      <motion.div
        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute w-3 h-3 rounded-full bg-[var(--marketing-accent-light)]",
          isRight ? "top-40 right-1/3" : "top-40 left-1/3"
        )}
      />
    </div>
  );
}

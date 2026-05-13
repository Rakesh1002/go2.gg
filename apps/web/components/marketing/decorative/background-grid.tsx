"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundGridProps {
  className?: string;
  color?: string;
}

export function BackgroundGrid({ className, color = "currentColor" }: BackgroundGridProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(to right, ${color} 1px, transparent 1px)`,
            backgroundSize: "4rem 4rem",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
            opacity: 0.1,
          }}
        />
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(to right, ${color} 1px, transparent 1px)`,
            backgroundSize: "1rem 1rem",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
            opacity: 0.05,
          }}
        />
      </motion.div>
      
      {/* Ambient Glow */}
      <div className="-translate-x-1/2 absolute top-0 left-1/2 h-[500px] w-full rounded-full bg-[var(--marketing-accent)]/5 mix-blend-screen blur-[100px]" />
    </div>
  );
}

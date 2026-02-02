"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

function AnimatedCard({ children, className }: AnimatedCardProps) {
  return <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>{children}</div>;
}

interface AnimatedEmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button text */
  primaryActionLabel?: string;
  /** Primary action callback */
  onPrimaryAction?: () => void;
  /** Primary action href (makes it a link) */
  primaryActionHref?: string;
  /** Secondary action label (e.g., "Learn more") */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Secondary action href */
  secondaryActionHref?: string;
  /** Preview cards to animate */
  cardContent?: React.ReactNode[];
  /** Number of visible cards in animation */
  visibleCards?: number;
  /** Animation speed in seconds */
  animationSpeed?: number;
  className?: string;
}

export function AnimatedEmptyState({
  icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionHref,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  cardContent,
  visibleCards = 3,
  animationSpeed = 3,
  className,
}: AnimatedEmptyStateProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const cards = cardContent || [];

  // Infinite scroll animation
  React.useEffect(() => {
    if (cards.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, animationSpeed * 1000);

    return () => clearInterval(interval);
  }, [cards.length, animationSpeed]);

  // Get visible cards with wrap-around
  const getVisibleCards = () => {
    if (cards.length === 0) return [];

    const result = [];
    for (let i = 0; i < Math.min(visibleCards, cards.length); i++) {
      const index = (currentIndex + i) % cards.length;
      result.push({ content: cards[index], index });
    }
    return result;
  };

  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}
    >
      {/* Animated cards preview */}
      {cards.length > 0 && (
        <div className="relative mb-8 h-48 w-full max-w-md overflow-hidden">
          <div className="relative h-full">
            {getVisibleCards().map((card, i) => (
              <motion.div
                key={`${card.index}-${i}`}
                initial={{ opacity: 0, y: 60 }}
                animate={{
                  opacity: i === 0 ? 1 : 0.6 - i * 0.2,
                  y: i * 16,
                  scale: 1 - i * 0.05,
                }}
                exit={{ opacity: 0, y: -60 }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
                className="absolute inset-x-4 top-4"
                style={{ zIndex: visibleCards - i }}
              >
                <AnimatedCard>{card.content}</AnimatedCard>
              </motion.div>
            ))}
          </div>
          {/* Gradient fade at bottom */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {primaryActionLabel && (
          <>
            {primaryActionHref ? (
              <Button asChild>
                <a href={primaryActionHref}>
                  {primaryActionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button onClick={onPrimaryAction}>
                {primaryActionLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
        {secondaryActionLabel && (
          <>
            {secondaryActionHref ? (
              <Button variant="outline" asChild>
                <a href={secondaryActionHref} target="_blank" rel="noopener noreferrer">
                  {secondaryActionLabel}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Example preview card for links
 */
export function LinkPreviewCard({
  shortUrl,
  destinationUrl,
  clicks,
}: {
  shortUrl: string;
  destinationUrl: string;
  clicks: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <span className="text-lg">🔗</span>
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-sm">{shortUrl}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{destinationUrl}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{clicks}</p>
        <p className="text-xs text-muted-foreground">clicks</p>
      </div>
    </div>
  );
}

/**
 * Simple empty state without animation
 */
export function SimpleEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-lg border border-dashed",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

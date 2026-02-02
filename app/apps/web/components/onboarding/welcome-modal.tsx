"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Link2,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  Check,
  QrCode,
  Sparkles,
  Target,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  onCreateLink?: () => void;
}

const tourSteps = [
  {
    id: "welcome",
    icon: Link2,
    title: "Welcome to Go2!",
    subtitle: "The open-source, edge-native URL shortener",
    description:
      "Go2 makes it easy to shorten, share, and track your links. Let's take a quick tour to help you get started.",
    features: [
      { icon: Zap, label: "Blazing Fast" },
      { icon: BarChart3, label: "Real-time Analytics" },
      { icon: Globe, label: "Custom Domains" },
      { icon: QrCode, label: "QR Codes" },
    ],
    cta: "Let's Go!",
  },
  {
    id: "create-links",
    icon: MousePointerClick,
    title: "Create Links",
    subtitle: "Shorten any URL in seconds",
    description:
      "Paste any long URL and get a short, memorable link instantly. Our AI can even suggest smart slugs based on your content.",
    tip: "Pro tip: Use the AI slug generator for SEO-friendly, memorable short links.",
    cta: "Create Your First Link",
    isCreateLink: true,
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Track Analytics",
    subtitle: "Real-time insights at your fingertips",
    description:
      "See exactly who's clicking your links with detailed analytics including locations, devices, browsers, and referrers - all in real-time.",
    tip: "Analytics update instantly - no waiting for data to sync.",
    cta: "Next",
  },
  {
    id: "domains",
    icon: Globe,
    title: "Custom Domains",
    subtitle: "Brand your links with your own domain",
    description:
      "Use your own domain (like links.yoursite.com) for professional, branded short links that build trust with your audience.",
    tip: "Custom domains improve click-through rates by up to 39%.",
    cta: "Next",
  },
  {
    id: "features",
    icon: Sparkles,
    title: "Powerful Features",
    subtitle: "Everything you need to succeed",
    description:
      "From QR codes and A/B testing to password protection and conversion tracking - Go2 has all the tools you need to level up your link strategy.",
    features: [
      { icon: QrCode, label: "QR Codes" },
      { icon: Target, label: "A/B Testing" },
      { icon: Zap, label: "API Access" },
      { icon: BarChart3, label: "Conversions" },
    ],
    cta: "Get Started!",
    isFinal: true,
  },
];

export function WelcomeModal({ onCreateLink }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem("go2_welcome_seen");
    if (!hasSeenWelcome) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem("go2_welcome_seen", "true");
    setOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }, [step, handleComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleCreateLink = useCallback(() => {
    localStorage.setItem("go2_welcome_seen", "true");
    setOpen(false);
    // Trigger the create link dialog after a small delay
    setTimeout(() => {
      onCreateLink?.();
    }, 100);
  }, [onCreateLink]);

  const handleCtaClick = useCallback(() => {
    const currentStep = tourSteps[step];
    if (currentStep.isCreateLink) {
      handleCreateLink();
    } else if (currentStep.isFinal) {
      handleComplete();
    } else {
      handleNext();
    }
  }, [step, handleCreateLink, handleComplete, handleNext]);

  const currentStep = tourSteps[step];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6 animate-in zoom-in-50 duration-300">
              <currentStep.icon className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Description */}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {currentStep.description}
            </p>

            {/* Tip */}
            {currentStep.tip && (
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{currentStep.tip}</span>
              </div>
            )}
          </div>

          {/* Feature grid (for welcome and features steps) */}
          {currentStep.features && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {currentStep.features.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <feature.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-1.5 py-2">
          {tourSteps.map((tourStep, i) => (
            <button
              type="button"
              key={tourStep.id}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "bg-primary w-8" : i < step ? "bg-primary/50 w-4" : "bg-muted w-4",
                "hover:opacity-80"
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                Back
              </Button>
            )}
          </div>
          <Button onClick={handleCtaClick} className="min-w-[140px]">
            {currentStep.isFinal ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {currentStep.cta}
              </>
            ) : (
              <>
                {currentStep.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

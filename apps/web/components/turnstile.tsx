"use client";

/**
 * Cloudflare Turnstile Component
 *
 * Provides invisible bot protection for forms.
 *
 * @example
 * ```tsx
 * <form onSubmit={handleSubmit}>
 *   <Turnstile onVerify={(token) => setTurnstileToken(token)} />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "invisible";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  /** Callback when verification succeeds */
  onVerify: (token: string) => void;
  /** Callback when verification fails */
  onError?: () => void;
  /** Callback when token expires */
  onExpire?: () => void;
  /** Theme - auto, light, or dark */
  theme?: "light" | "dark" | "auto";
  /** Size of the widget */
  size?: "normal" | "compact" | "invisible";
  /** When to show the widget */
  appearance?: "always" | "execute" | "interaction-only";
  /** Additional CSS class */
  className?: string;
}

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "invisible",
  appearance = "interaction-only",
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Skip if no site key configured
    if (!siteKey) {
      console.warn("Turnstile site key not configured");
      // Auto-verify in development without Turnstile
      if (process.env.NODE_ENV === "development") {
        onVerify("development-bypass-token");
      }
      return;
    }

    // Load Turnstile script if not already loaded
    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleVerify,
        "error-callback": handleError,
        "expired-callback": handleExpire,
        theme,
        size,
        appearance,
      });
    };

    // Wait for script to load
    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
      }
    };
  }, [handleVerify, handleError, handleExpire, theme, size, appearance, onVerify]);

  // Don't render anything if no site key
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}

/**
 * Hook to manage Turnstile token state
 */
export function useTurnstile() {
  const tokenRef = useRef<string | null>(null);

  const setToken = useCallback((token: string) => {
    tokenRef.current = token;
  }, []);

  const getToken = useCallback(() => tokenRef.current, []);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
  }, []);

  return {
    setToken,
    getToken,
    clearToken,
  };
}

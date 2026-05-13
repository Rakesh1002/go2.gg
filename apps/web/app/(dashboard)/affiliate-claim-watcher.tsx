"use client";

import { useEffect } from "react";

/**
 * Reads the `go2_ref_code` cookie on dashboard mount and POSTs it to
 * /api/v1/affiliates/me/claim once. The endpoint is idempotent and clears
 * the cookie on success — so re-runs are no-ops once the user has been
 * attributed (or rejected for self-referral / unknown code).
 *
 * Mounted once at the dashboard layout level. Renders nothing.
 */
const COOKIE_NAME = "go2_ref_code";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function AffiliateClaimWatcher() {
  useEffect(() => {
    const code = readCookie(COOKIE_NAME);
    if (!code) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
    fetch(`${apiUrl}/api/v1/affiliates/me/claim`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // network error — try again on next mount
    });
  }, []);

  return null;
}

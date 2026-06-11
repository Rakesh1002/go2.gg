"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Reads the guest claim token written by the marketing "try it" shortener and
 * POSTs it to /api/v1/claim/by-token once on dashboard mount, transferring any
 * still-anonymous links the visitor created to their new account. The endpoint
 * consumes the server-side token, so the local copy is cleared after any 2xx.
 *
 * Mounted once at the dashboard layout level. Renders nothing.
 */
const CLAIM_TOKEN_KEY = "go2:guest-claim-token";

function readToken(): string | null {
  try {
    return localStorage.getItem(CLAIM_TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearToken() {
  try {
    localStorage.removeItem(CLAIM_TOKEN_KEY);
  } catch {
    // private mode / storage disabled — nothing to clear
  }
}

export function GuestLinkClaimWatcher() {
  useEffect(() => {
    const token = readToken();
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
    fetch(`${apiUrl}/api/v1/claim/by-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimToken: token }),
    })
      .then(async (res) => {
        if (!res.ok) return; // keep token for a retry on the next mount
        const json = (await res.json().catch(() => null)) as {
          data?: { claimed?: number };
        } | null;
        clearToken();
        const claimed = json?.data?.claimed ?? 0;
        if (claimed > 0) {
          toast.success(`Claimed ${claimed} link${claimed > 1 ? "s" : ""} to your dashboard`);
        }
      })
      .catch(() => {
        // network error — retry on the next dashboard mount
      });
  }, []);

  return null;
}

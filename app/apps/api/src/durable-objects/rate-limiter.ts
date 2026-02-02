/**
 * Rate Limiter Durable Object
 *
 * Provides distributed rate limiting using Cloudflare Durable Objects.
 * Uses a sliding window algorithm for accurate rate limiting.
 */

import type { DurableObjectState } from "@cloudflare/workers-types";

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  window: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private state: DurableObjectState;
  private requests: number[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/check") {
      const config: RateLimitConfig = {
        limit: parseInt(url.searchParams.get("limit") ?? "100"),
        window: parseInt(url.searchParams.get("window") ?? "60"),
      };

      const result = await this.checkLimit(config);
      return Response.json(result);
    }

    if (url.pathname === "/reset") {
      await this.reset();
      return Response.json({ reset: true });
    }

    return new Response("Not Found", { status: 404 });
  }

  private async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    // Load current requests from storage
    const stored = await this.state.storage.get<number[]>("requests");
    this.requests = stored ?? [];

    const now = Date.now();
    const windowStart = now - config.window * 1000;

    // Remove expired requests (sliding window)
    this.requests = this.requests.filter((timestamp) => timestamp > windowStart);

    // Check if under limit
    if (this.requests.length < config.limit) {
      // Add current request
      this.requests.push(now);
      await this.state.storage.put("requests", this.requests);

      return {
        allowed: true,
        remaining: config.limit - this.requests.length,
        resetAt: Math.ceil((this.requests[0] ?? now + config.window * 1000) / 1000),
      };
    }

    // Rate limited
    const oldestRequest = this.requests[0] ?? now;
    const resetAt = Math.ceil((oldestRequest + config.window * 1000) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  private async reset(): Promise<void> {
    this.requests = [];
    await this.state.storage.delete("requests");
  }
}

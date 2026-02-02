/**
 * CORS Middleware
 */

import { cors } from "hono/cors";
import type { Env } from "../bindings.js";

export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const env = c.env as Env;
      const allowedOrigins = [env.APP_URL, "http://localhost:3000"];

      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) {
        return "*";
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // In development, allow any localhost origin
      if (env.ENVIRONMENT === "development" && origin.includes("localhost")) {
        return origin;
      }

      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID", "X-RateLimit-Remaining"],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
}

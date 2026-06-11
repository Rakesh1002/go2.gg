import { z } from "zod";

/**
 * zod's .url() is URL-constructor based and accepts javascript:, data:,
 * vbscript: etc. Destinations get rendered into hrefs, iframes, and meta
 * refreshes — the strict API CSP is the only thing standing between those
 * schemes and execution, and defense shouldn't be one header deep.
 */
const EXECUTABLE_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;

/** http(s)-only URL — for destinations and anything rendered as a link. */
export function httpUrl(message = "Invalid URL") {
  return z
    .string()
    .url(message)
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "Only http(s) URLs are allowed",
    });
}

/**
 * Deep link — custom app schemes (myapp://) are the point of iosUrl and
 * androidUrl, so only executable schemes are rejected.
 */
export function deepLinkUrl() {
  return z
    .string()
    .url("Invalid URL")
    .refine((value) => !EXECUTABLE_SCHEMES.test(value), {
      message: "This URL scheme is not allowed",
    });
}

/**
 * Polyfills for esbuild's helper functions
 * This fixes "__name is not defined" errors when using libraries
 * bundled with esbuild's keepNames option in Cloudflare Workers
 */

// __name is used by esbuild when keepNames is enabled
// It sets the name property on functions for debugging
if (typeof globalThis.__name === "undefined") {
  globalThis.__name = function (fn, name) {
    try {
      Object.defineProperty(fn, "name", { value: name, configurable: true });
    } catch (e) {
      // Some functions can't have their name changed
    }
    return fn;
  };
}

// Also define on window for browser environments
if (typeof window !== "undefined" && typeof window.__name === "undefined") {
  window.__name = globalThis.__name;
}

// Define as a global var for scripts that expect it
if (typeof __name === "undefined") {
  var __name = globalThis.__name;
}

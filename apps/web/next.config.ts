import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Experimental features for edge deployment
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
    // For Cloudflare deployment, we may need to use unoptimized images
    // or set up a custom loader
    unoptimized: process.env.CLOUDFLARE_DEPLOYMENT === "true",
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Rewrites for SEO/Indexing
  async rewrites() {
    return [
      // IndexNow key verification - serve key at /{key}.txt
      // The key value is read from INDEXNOW_API_KEY env var
      {
        source: "/:key([a-f0-9]{32}).txt",
        destination: "/api/indexnow-key",
      },
    ];
  },

  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787",
  },

  // Transpile workspace packages and dependencies that need it
  // Note: better-auth needs transpilation to fix __name is not defined error
  transpilePackages: ["@repo/ui", "better-auth"],

  // Optimize for production
  poweredByHeader: false,

  // Enable source maps in production for error tracking
  productionBrowserSourceMaps: true,
};

export default nextConfig;

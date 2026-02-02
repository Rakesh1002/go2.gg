import { ImageResponse } from "next/og";
import { siteConfig } from "@repo/config";

export const runtime = "edge";

export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        position: "relative",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Arrow icon representing "go to" */}
          <svg
            width="60"
            height="60"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 16 L22 16 M17 11 L22 16 L17 21"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand Name */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        {siteConfig.name}
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 32,
          color: "rgba(255, 255, 255, 0.95)",
          textAlign: "center",
          marginTop: 20,
          maxWidth: 800,
          fontWeight: 500,
        }}
      >
        {siteConfig.tagline}
      </div>

      {/* Features */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 48,
        }}
      >
        {["Sub-10ms Redirects", "Real-time Analytics", "Custom Domains", "QR Codes"].map(
          (feature) => (
            <div
              key={feature}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                borderRadius: 50,
                padding: "12px 24px",
                fontSize: 18,
                color: "white",
                fontWeight: 600,
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {feature}
            </div>
          )
        )}
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 24,
          color: "rgba(255, 255, 255, 0.8)",
          fontWeight: 600,
        }}
      >
        go2.gg
      </div>
    </div>,
    {
      ...size,
    }
  );
}

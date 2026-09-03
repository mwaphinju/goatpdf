import { ImageResponse } from "next/og";

export const alt = "GOAT PDF: Free PDF Tools That Just Work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The default social-preview image for the whole site — Next.js falls back
// to the nearest ancestor's opengraph-image when a route (every tool page,
// the legal pages) doesn't define its own, so this single file covers all
// of them without 8+ near-duplicate per-tool image files.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "linear-gradient(to bottom, #ecfdf5, #ffffff)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 72,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#047857",
              color: "#ffffff",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            PDF
          </div>
          GOAT PDF
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#475569" }}>
          Free PDF Tools That Just Work
        </div>
      </div>
    ),
    { ...size },
  );
}

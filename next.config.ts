import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows the Next.js dev server to serve its dev-only static chunks (e.g. the
  // dynamically-imported pdf-lib bundle) when the app is opened from another
  // device on the LAN during `next dev`, instead of only from localhost.
  // Dev-only — has no effect on `next build`/`next start`.
  allowedDevOrigins: ["192.168.0.101"],
  // @napi-rs/canvas ships a native addon (a .node binary) that can't be
  // placed into a bundled ESM chunk; pdfjs-dist's Node build also expects to
  // load its standard-font/cmap data files straight from node_modules at
  // runtime. Both must stay external and be require()'d directly from
  // node_modules instead of being bundled.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;

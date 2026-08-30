import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows the Next.js dev server to serve its dev-only static chunks (e.g. the
  // dynamically-imported pdf-lib bundle) when the app is opened from another
  // device on the LAN during `next dev`, instead of only from localhost.
  // Dev-only — has no effect on `next build`/`next start`.
  allowedDevOrigins: ["192.168.0.101"],
};

export default nextConfig;

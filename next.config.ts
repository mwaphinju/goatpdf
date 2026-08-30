import type { NextConfig } from "next";

// Deliberately no external script/style/font/image origins anywhere in this
// app (next/font self-hosts Google fonts at build time; every asset is
// same-origin), so the policy below can stay tight instead of needing a
// long allow-list. style-src keeps 'unsafe-inline' because next/font injects
// small inline <style> tags for font-fallback metrics.
//
// script-src also keeps 'unsafe-inline': the App Router injects its own
// inline bootstrap/hydration scripts on every page, and a correctly nonce'd
// CSP (Next's documented approach) requires forcing every route — including
// the currently-static marketing/tool pages — into per-request dynamic
// rendering, since a nonce baked into statically prerendered HTML at build
// time can never match a fresh per-request nonce. That's a real architecture
// change this pass isn't making. There is no known script/HTML-injection
// vector in this app to exploit via inline scripts — no dangerouslySetInnerHTML,
// no unsanitized user content ever rendered as markup, user-supplied
// filenames are sanitized (see files/validate.ts) before they're ever
// displayed — but this is a deliberate, documented trade-off, not an
// oversight.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // 'data:' doesn't allow fetching a remote origin — a data: URI is
  // constructed entirely from the current document, not fetched over the
  // network — so allowing it here doesn't weaken protection against
  // exfiltration to an attacker-controlled origin. Needed for `fetch("data:...")`
  // → Blob conversions (used by the drag-and-drop e2e test's DataTransfer setup).
  "connect-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

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
  async headers() {
    return [
      // Applied to every route (pages and API alike) — there is no cross-origin
      // API consumer to accommodate, so the same locked-down policy is correct
      // everywhere. No Access-Control-Allow-Origin is ever set, which keeps
      // /api/* responses unreadable from any other origin (the CORS default).
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Belt-and-suspenders against indexing: robots.ts already disallows
      // crawling /api/ (processing endpoints and single-use download links),
      // but a URL discovered another way (linked externally, referrer leak)
      // could otherwise still be indexed without ever being crawled. This
      // header rules that out unconditionally.
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /api/ (processing endpoints and single-use download links) is disallowed
// here as one layer of defense against indexing; the /api/:path* response
// headers also carry X-Robots-Tag: noindex, nofollow (see next.config.ts) so
// a download link discovered another way still can't be indexed.
//
// Investigated 2026-09-02: Search Console's "Test Live URL" reported
// /tools/compress-pdf as "Blocked by robots.txt". Directly verified against
// production at the time — live robots.txt was exactly Allow: "/",
// Disallow: ["/api/"] (i.e. this file, unmodified since it was first added),
// the tool page carried no X-Robots-Tag or <meta name="robots"> of any kind,
// and no middleware.ts exists anywhere in this app. robots.ts has never
// disallowed /tools/ at any point in its git history. The much more likely
// explanation: Google caches robots.txt fetches, and a failed fetch (e.g.
// Googlebot hitting this Render free-tier instance during a cold-start
// delay, or a transient edge 5xx — both observed directly on this exact
// deployment) makes Google fall back to treating the whole site as
// disallowed until it can re-fetch successfully. Not a code defect — no
// functional change was made here as a result of this investigation.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

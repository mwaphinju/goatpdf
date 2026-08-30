import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /api/ (processing endpoints and single-use download links) is disallowed
// here as one layer of defense against indexing; the /api/:path* response
// headers also carry X-Robots-Tag: noindex, nofollow (see next.config.ts) so
// a download link discovered another way still can't be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

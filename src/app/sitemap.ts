import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { tools } from "@/lib/tools";
import { localizedSitemapEntries } from "@/i18n/sitemap";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS } from "@/i18n/toolContent";
import { EN_TO_DE_PATH } from "@/i18n/pageMap";

// No lastModified dates — this app doesn't track real per-page content-change
// timestamps, and a fabricated date would be worse than none at all.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  // Week 2 Day 3 long-tail guide articles: supporting content, not primary
  // conversion pages, so a slightly lower priority than the tool pages
  // themselves.
  const blogSlugs = [
    "how-to-compress-a-pdf-for-email",
    "how-to-merge-multiple-pdfs-in-order",
    "pdf-to-word-formatting-what-to-expect",
    "rotate-pdf-permanently-vs-viewer-rotation",
  ];
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Week 2 Day 5: the 5 launched German pages, routed through the Day 4
  // localizedSitemapEntries helper so they only actually appear once "de"
  // is in READY_LOCALES (see @/i18n/config) — the same gate hreflang uses,
  // so the sitemap and hreflang can never disagree about what's real. Only
  // the German path is passed in (not an "en" one too) since the English
  // homepage/tool pages are already listed above via staticPages/toolPages.
  const germanHomePage = localizedSitemapEntries(
    { de: EN_TO_DE_PATH["/"] },
    { absoluteUrl, changeFrequency: "weekly", priority: 1 },
  );

  const germanToolPages = LAUNCHED_GERMAN_TOOL_SLUGS.flatMap((slug) =>
    localizedSitemapEntries({ de: GERMAN_TOOL_ROUTES[slug] }, { absoluteUrl, changeFrequency: "monthly", priority: 0.9 }),
  );

  return [...staticPages, ...toolPages, ...blogPages, ...germanHomePage, ...germanToolPages];
}

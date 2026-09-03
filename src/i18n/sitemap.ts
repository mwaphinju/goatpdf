import type { MetadataRoute } from "next";
import { READY_LOCALES, type Locale } from "./config";

/** A page's path in each locale that actually has a real, indexable version of it. */
export type LocalizedSitemapPaths = Partial<Record<Locale, string>>;

export interface LocalizedSitemapEntryOptions {
  absoluteUrl: (path: string) => string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

/**
 * Turns a page's per-locale paths into sitemap entries, one per ready
 * locale. Not wired into src/app/sitemap.ts yet: with READY_LOCALES
 * currently only ["en"] (see ./config.ts), the real sitemap doesn't need
 * this indirection today, and wiring it in now would touch a file that
 * already has passing tests asserting its exact current output for no
 * behavioral difference.
 *
 * When Day 5 adds German pages, src/app/sitemap.ts can map its existing
 * per-page path lists through this function instead of hand-writing a
 * second set of entries: pass `{ en: "/tools/compress-pdf", de:
 * "/de/tools/pdf-komprimieren" }` and only the locales both present here
 * AND in READY_LOCALES produce an entry, so a locale that's added to this
 * map before its content is actually ready still can't leak into the
 * sitemap.
 */
export function localizedSitemapEntries(
  paths: LocalizedSitemapPaths,
  { absoluteUrl, changeFrequency, priority }: LocalizedSitemapEntryOptions,
): MetadataRoute.Sitemap {
  return READY_LOCALES.filter((locale) => paths[locale] !== undefined).map((locale) => ({
    url: absoluteUrl(paths[locale] as string),
    changeFrequency,
    priority,
  }));
}

/**
 * Central locale configuration. Every other i18n module (dictionaries,
 * hreflang building, locale-aware metadata) reads from this file rather
 * than hard-coding locale lists of its own, so adding a language later is
 * a change in one place.
 */

export const SUPPORTED_LOCALES = ["en", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Locales whose content is complete and reviewed enough to expose as real,
 * indexable public pages (routes, sitemap entries, hreflang alternates).
 * Every locale-aware helper in this app treats a locale not in this list
 * as architecture-only, never publishing a live URL, sitemap entry, or
 * hreflang link for it. Flip an entry into this list only once a
 * locale's content is genuinely ready, not when its dictionary merely
 * exists.
 *
 * "de" was added here in Week 2 Day 5, after all 5 launched German pages
 * (homepage, Compress, Merge, Split, PDF to Word) existed, rendered
 * correctly, had complete German UI/metadata/structured data, and passed
 * the full test suite. See GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md.
 * The other 4 tools, the 4 blog guides, and the legal pages are still
 * English-only: this flag does not mean the whole site is translated,
 * only that the specific German pages that exist are ready to be found.
 */
export const READY_LOCALES: readonly Locale[] = ["en", "de"];

export function isLocaleReady(locale: Locale): boolean {
  return READY_LOCALES.includes(locale);
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

/** Open Graph's `og:locale` expects an underscore-joined language_TERRITORY tag. */
export const LOCALE_OG_MAP: Record<Locale, string> = {
  en: "en_US",
  de: "de_DE",
};

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

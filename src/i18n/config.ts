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
 * "de" stays out of this list until Day 5 actually ships German content;
 * until then, every locale-aware helper in this app treats "de" as
 * architecture-only, never publishing a live URL, sitemap entry, or
 * hreflang link for it. Flip this when a locale's content is genuinely
 * ready, not when its dictionary merely exists.
 */
export const READY_LOCALES: readonly Locale[] = ["en"];

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

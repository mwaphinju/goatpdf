import { DEFAULT_LOCALE, READY_LOCALES, type Locale } from "./config";

/** A path for each locale that actually has a real page for it, e.g. `{ en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" }`. */
export type LocalizedPaths = Partial<Record<Locale, string>>;

/**
 * Builds a Next.js Metadata `alternates.languages` map from a set of
 * candidate localized paths, keeping only locales that are both present
 * in `paths` AND marked ready in READY_LOCALES (see ./config.ts). This is
 * the single choke point that makes it structurally impossible to publish
 * an hreflang link to a German page that doesn't exist yet or isn't
 * finished: a caller can pass a full `{ en, de }` map today and this
 * function will still only ever emit "en" until "de" is added to
 * READY_LOCALES.
 *
 * Returns undefined (not an empty object) when fewer than two ready
 * locales are available, since a single-locale hreflang set communicates
 * nothing search engines don't already know from the canonical URL.
 *
 * When at least two ready locales are present, also adds "x-default"
 * pointing at DEFAULT_LOCALE's URL, per Google's recommended pattern for
 * a language/region selector page.
 */
export function buildHreflangLanguages(
  paths: LocalizedPaths,
  absoluteUrl: (path: string) => string,
): Record<string, string> | undefined {
  const readyEntries = READY_LOCALES.map((locale) => [locale, paths[locale]] as const).filter(
    (entry): entry is [Locale, string] => entry[1] !== undefined,
  );

  if (readyEntries.length < 2) return undefined;

  const languages: Record<string, string> = {};
  for (const [locale, path] of readyEntries) {
    languages[locale] = absoluteUrl(path);
  }

  const defaultPath = paths[DEFAULT_LOCALE];
  if (defaultPath) languages["x-default"] = absoluteUrl(defaultPath);

  return languages;
}

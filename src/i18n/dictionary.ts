import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { de } from "./dictionaries/de";

/**
 * The full, required shape every locale's content is measured against.
 * Deliberately scoped to shared/global, high-frequency strings for Day 4
 * (common UI, navigation, footer, buttons, upload/processing states,
 * errors, accessibility labels) rather than every string in the app.
 *
 * Tool names/descriptions, tool FAQs, blog articles, and legal page copy
 * are NOT part of this dictionary yet: they're long-form, SEO-sensitive
 * content that needs careful per-string translation review, not a
 * mechanical key/value swap. See GOAT_PDF_WEEK2_DAY4_I18N_REPORT.md's
 * "Translation Resource Structure" section for the migration plan.
 */
export interface Dictionary {
  common: {
    siteName: string;
    tagline: string;
  };
  navigation: {
    home: string;
    tools: string;
    allTools: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    description: string;
    guides: string;
    company: string;
  };
  buttons: {
    chooseFile: string;
    startOver: string;
    tryAgain: string;
    download: string;
    cancel: string;
    processAnotherFile: string;
  };
  upload: {
    dragDropLabel: string;
    dropHere: string;
    browsePrefix: string;
    browseLink: string;
    browseSuffix: string;
    unsupportedFileType: string;
    fileTooLargeDetail: string;
    removeFile: string;
  };
  processing: {
    processing: string;
    pleaseWait: string;
    processingFile: string;
  };
  errors: {
    networkError: string;
    invalidFile: string;
    fileTooLarge: string;
    processingFailed: string;
    corruptedFile: string;
  };
  success: {
    downloadReady: string;
  };
  pageStatus: {
    reading: string;
    pageCountSingular: string;
    pageCountPlural: string;
  };
  fileList: {
    moveUp: string;
    moveDown: string;
  };
  a11y: {
    languageSelector: string;
    currentLanguage: string;
  };
}

type DictionarySection = keyof Dictionary;

/** A non-English locale only needs to supply the keys it has actually translated; everything else falls back to English. */
export type PartialDictionary = {
  [Section in DictionarySection]?: Partial<Dictionary[Section]>;
};

const DICTIONARIES: Record<Locale, PartialDictionary> = { en, de };

export interface MissingTranslationKey {
  section: DictionarySection;
  key: string;
}

/**
 * Resolves a full Dictionary for `locale`, filling any key the locale's
 * own dictionary doesn't define with the English value for that same key.
 * Never returns undefined, an empty string, or a raw "section.key" token
 * for a defined Dictionary key: the English dictionary is complete, so
 * the fallback always has something real to fall back to.
 *
 * In non-production environments, logs each key that had to fall back
 * (via onMissing, defaulting to console.warn) so incomplete locale
 * coverage is visible during development without affecting real visitors.
 */
export function getDictionary(
  locale: Locale,
  options: { onMissing?: (missing: MissingTranslationKey) => void } = {},
): Dictionary {
  const localeDict = DICTIONARIES[locale] ?? {};
  const englishDict = DICTIONARIES[DEFAULT_LOCALE] as Dictionary;
  const warn =
    options.onMissing ??
    (process.env.NODE_ENV !== "production"
      ? (missing: MissingTranslationKey) =>
          console.warn(`[i18n] Missing "${locale}" translation for "${missing.section}.${missing.key}", using English fallback.`)
      : undefined);

  const result = {} as Dictionary;

  for (const section of Object.keys(englishDict) as DictionarySection[]) {
    const englishValues = englishDict[section];
    const localeValues = localeDict[section] ?? {};
    const merged: Record<string, string> = {};

    for (const key of Object.keys(englishValues)) {
      const localeValue = (localeValues as Record<string, string>)[key];
      if (localeValue !== undefined) {
        merged[key] = localeValue;
      } else {
        merged[key] = (englishValues as Record<string, string>)[key];
        if (locale !== DEFAULT_LOCALE) warn?.({ section, key });
      }
    }

    (result as unknown as Record<string, unknown>)[section] = merged;
  }

  return result;
}

/** Fills `{token}` placeholders in a dictionary string, e.g. interpolate(t.errors.rangeInvalid, { max: pageCount }). */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : match,
  );
}

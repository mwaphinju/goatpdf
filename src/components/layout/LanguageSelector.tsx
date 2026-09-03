"use client";

import { DEFAULT_LOCALE, LOCALE_NAMES, SUPPORTED_LOCALES, isLocaleReady } from "@/i18n/config";
import { GlobeIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Compact language selector, foundation-only for now: English is the only
 * ready locale (see READY_LOCALES in @/i18n/config), so it's the only
 * option that's an actual, clickable link. Every other supported locale
 * (currently just German) renders as a visibly present but disabled
 * option, never a link to a page that doesn't exist yet or isn't finished
 * (see CLAUDE.md and GOAT_PDF_WEEK2_DAY4_I18N_REPORT.md's "Language
 * Selector" section for the reasoning). Once a locale is added to
 * READY_LOCALES, this component needs no changes: it already derives its
 * option list from SUPPORTED_LOCALES/READY_LOCALES.
 */
export function LanguageSelector() {
  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Language: ${LOCALE_NAMES[DEFAULT_LOCALE]}`}
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_NAMES[DEFAULT_LOCALE]}</span>
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div
        role="group"
        aria-label="Language"
        className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const ready = isLocaleReady(locale);
          const isCurrent = locale === DEFAULT_LOCALE;

          if (ready) {
            return (
              <div
                key={locale}
                aria-current={isCurrent ? "true" : undefined}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {LOCALE_NAMES[locale]}
                {isCurrent && <span className="text-xs text-emerald-700 dark:text-emerald-400">Current</span>}
              </div>
            );
          }

          return (
            <div
              key={locale}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-600"
            >
              {LOCALE_NAMES[locale]}
              <span className="text-xs">Coming soon</span>
            </div>
          );
        })}
      </div>
    </details>
  );
}

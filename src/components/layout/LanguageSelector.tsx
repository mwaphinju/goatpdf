"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_NAMES, SUPPORTED_LOCALES, isLocaleReady, type Locale } from "@/i18n/config";
import { DE_TO_EN_PATH, EN_TO_DE_PATH } from "@/i18n/pageMap";
import { GlobeIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Compact language selector. Derives its option list from
 * SUPPORTED_LOCALES/READY_LOCALES (see @/i18n/config) and the current
 * locale from the page it's rendered on: German pages pass
 * currentLocale="de", every English page (the default) needs nothing
 * extra.
 *
 * A ready, non-current locale becomes a real link, never a link to a page
 * that doesn't exist: on an English page with a specific German
 * equivalent (see @/i18n/pageMap's EN_TO_DE_PATH, currently the 5
 * launched pages), Deutsch links to that exact page; on any other
 * English page, it links to the German homepage (/de) instead of being
 * unavailable, since that's still a real, useful destination and less
 * confusing than a dead control. On a German page, English always links
 * to the exact English counterpart (every German page has one by
 * construction). A locale that isn't ready yet always renders disabled,
 * regardless of any mapping.
 */
export function LanguageSelector({ currentLocale = DEFAULT_LOCALE }: { currentLocale?: Locale } = {}) {
  const pathname = usePathname();

  function targetPathFor(locale: Locale): string {
    if (locale === "de") return EN_TO_DE_PATH[pathname] ?? "/de";
    return DE_TO_EN_PATH[pathname] ?? "/";
  }

  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Language: ${LOCALE_NAMES[currentLocale]}`}
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_NAMES[currentLocale]}</span>
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div
        role="group"
        aria-label="Language"
        className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const isCurrent = locale === currentLocale;

          if (isCurrent) {
            return (
              <div
                key={locale}
                aria-current="true"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {LOCALE_NAMES[locale]}
                <span className="text-xs text-emerald-700 dark:text-emerald-400">Current</span>
              </div>
            );
          }

          if (isLocaleReady(locale)) {
            return (
              <Link
                key={locale}
                href={targetPathFor(locale)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {LOCALE_NAMES[locale]}
              </Link>
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

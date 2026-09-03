import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { germanToolContent } from "@/i18n/toolContent/de";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS } from "@/i18n/toolContent";
import { EN_TO_DE_PATH } from "@/i18n/pageMap";

const DESCRIPTION =
  "PDF-Dateien online komprimieren, zusammenfügen, teilen und in Word umwandeln, schnell und einfach.";

const TITLE = "GOAT PDF: Kostenlose PDF-Tools, die einfach funktionieren";

export const metadata: Metadata = {
  // buildPageMetadata gives correctly-gated hreflang (see
  // buildHreflangLanguages in @/i18n/hreflang: it only ever emits an
  // alternate for a locale in READY_LOCALES) plus openGraph/twitter; the
  // <title> is then set explicitly to bypass the German root layout's
  // "%s | GOAT PDF" template, the same override pattern (en)/layout.tsx
  // uses for the English homepage.
  ...buildPageMetadata({
    path: "/de",
    title: "Kostenlose PDF-Tools, die einfach funktionieren",
    description: DESCRIPTION,
    locale: "de",
    alternateLanguages: { en: "/", de: EN_TO_DE_PATH["/"] },
  }),
  title: { absolute: TITLE },
};

const toolListStructuredDataDe = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: LAUNCHED_GERMAN_TOOL_SLUGS.map((slug, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: germanToolContent[slug].name,
    url: absoluteUrl(GERMAN_TOOL_ROUTES[slug]),
  })),
};

export default function GermanHome() {
  return (
    <>
      <JsonLd data={toolListStructuredDataDe} />

      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50 to-white dark:border-slate-800 dark:from-emerald-950 dark:to-slate-950">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Kostenlose PDF-Tools, die einfach funktionieren
          </h1>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400">
            PDF-Dateien online komprimieren, zusammenfügen, teilen und in Word umwandeln, schnell und einfach.
          </p>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Alle Tools</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Wähle ein Tool, um loszulegen. Keine Anmeldung nötig.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAUNCHED_GERMAN_TOOL_SLUGS.map((slug) => {
            const tool = getToolBySlug(slug)!;
            const Icon = tool.icon;
            const content = germanToolContent[slug];
            return (
              <Link
                key={slug}
                href={GERMAN_TOOL_ROUTES[slug]}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:outline-emerald-500"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:group-hover:bg-emerald-900">
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-white">{content.name}</span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{content.intro.split(". ")[0]}.</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Keine Konten, keine Wasserzeichen, kein Haken</h2>
          <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
            Jedes Tool auf dieser Seite funktioniert gleich: Datei hochladen, Ergebnis erhalten, herunterladen.
            Es gibt nichts, wofür du dich anmelden musst, und nichts wird deiner Datei hinzugefügt.
            Hochgeladene Dateien werden vertraulich verarbeitet und automatisch gelöscht. Mehr dazu in der{" "}
            <Link href="/privacy" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { genericFaqStructuredData } from "@/lib/structuredData";
import { getToolBySlug } from "@/lib/tools";
import { germanToolContent } from "@/i18n/toolContent/de";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS, type LaunchedGermanToolSlug } from "@/i18n/toolContent";

/**
 * The German equivalent of ToolPageLayout, for the 4 tools launched in
 * German (see GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md). Kept as its
 * own component, not a locale branch inside ToolPageLayout, because its
 * related-tools section deliberately only ever links to the other
 * launched German tool pages, never back to an English or nonexistent
 * German route, which needs different data (GERMAN_TOOL_ROUTES) than the
 * English layout's tool registry lookup.
 */
export function GermanToolPageLayout({ slug, children }: { slug: LaunchedGermanToolSlug; children: ReactNode }) {
  const tool = getToolBySlug(slug)!;
  const Icon = tool.icon;
  const content = germanToolContent[slug];
  const path = GERMAN_TOOL_ROUTES[slug];
  const faqStructuredData = genericFaqStructuredData(content.faqs);
  const relatedSlugs = LAUNCHED_GERMAN_TOOL_SLUGS.filter((s) => s !== slug);
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: absoluteUrl("/de") },
      { "@type": "ListItem", position: 2, name: content.name, item: absoluteUrl(path) },
    ],
  };
  // Hand-built rather than reusing toolSoftwareApplicationStructuredData:
  // that function always derives `url` from the English `/tools/<slug>`
  // path, which would make this page's own structured data claim it's
  // located at the English URL instead of self-referencing this German
  // page (caught by live verification against a real production build).
  const softwareApplicationStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${content.name} | ${SITE_NAME}`,
    description: content.intro,
    url: absoluteUrl(path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (browser-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: "de",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={softwareApplicationStructuredData} />
      <JsonLd data={breadcrumbStructuredData} />
      {faqStructuredData && <JsonLd data={faqStructuredData} />}

      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Icon className="h-8 w-8" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{content.name}</h1>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-16 flex flex-col gap-10 border-t border-slate-200 pt-10 text-left dark:border-slate-800">
          <div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{content.intro}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">Unterstützte Formate:</span> {content.supportedFormats}
            </p>
          </div>

          {content.whyUseIt.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Warum GOAT PDF nutzen?</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {content.whyUseIt.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <span aria-hidden className="text-emerald-600 dark:text-emerald-400">
                      •
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">So funktioniert es</h2>
            <ol className="mt-3 flex flex-col gap-3">
              {content.howTo.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {content.useCases.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Typische Anwendungsfälle</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {content.useCases.map((useCase) => (
                  <li key={useCase} className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <span aria-hidden className="text-emerald-600 dark:text-emerald-400">
                      •
                    </span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {content.faqs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Häufig gestellte Fragen</h2>
              <dl className="mt-3 flex flex-col gap-4">
                {content.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="font-medium text-slate-900 dark:text-white">{faq.question}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {relatedSlugs.length > 0 && (
        <div className="mx-auto mt-16 max-w-2xl border-t border-slate-200 pt-10 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Weitere Tools</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {relatedSlugs.map((relatedSlug) => {
              const relatedTool = getToolBySlug(relatedSlug)!;
              const RelatedIcon = relatedTool.icon;
              const relatedContent = germanToolContent[relatedSlug];
              return (
                <Link
                  key={relatedSlug}
                  href={GERMAN_TOOL_ROUTES[relatedSlug]}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:outline-emerald-500"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:group-hover:bg-emerald-900">
                    <RelatedIcon className="h-6 w-6" />
                  </span>
                  <span className="block font-semibold text-slate-900 dark:text-white">{relatedContent.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

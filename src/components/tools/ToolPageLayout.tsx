import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { RelatedTools } from "@/components/tools/RelatedTools";
import {
  toolBreadcrumbStructuredData,
  toolFaqStructuredData,
  toolSoftwareApplicationStructuredData,
} from "@/lib/structuredData";
import type { ToolDefinition } from "@/lib/tools";

export function ToolPageLayout({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  const Icon = tool.icon;
  const faqStructuredData = toolFaqStructuredData(tool);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={toolSoftwareApplicationStructuredData(tool)} />
      <JsonLd data={toolBreadcrumbStructuredData(tool)} />
      {faqStructuredData && <JsonLd data={faqStructuredData} />}

      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Icon className="h-8 w-8" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{tool.name}</h1>
          <p className="max-w-md text-slate-600 dark:text-slate-400">{tool.description}</p>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-16 flex flex-col gap-10 border-t border-slate-200 pt-10 text-left dark:border-slate-800">
          <div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{tool.intro}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">Supported formats:</span>{" "}
              {tool.supportedFormats}
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How it works</h2>
            <ol className="mt-3 flex flex-col gap-3">
              {tool.howTo.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {tool.useCases.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Common use cases</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {tool.useCases.map((useCase) => (
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

          {tool.faqs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
              <dl className="mt-3 flex flex-col gap-4">
                {tool.faqs.map((faq) => (
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

      <RelatedTools currentSlug={tool.slug} />
    </div>
  );
}

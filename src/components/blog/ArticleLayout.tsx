import type { ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/Button";
import {
  articleBreadcrumbStructuredData,
  articleStructuredData,
  genericFaqStructuredData,
} from "@/lib/structuredData";

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleCta {
  toolName: string;
  toolSlug: string;
  label: string;
}

export function ArticleLayout({
  path,
  title,
  description,
  datePublished,
  cta,
  faqs = [],
  children,
}: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  cta: ArticleCta;
  faqs?: ArticleFaq[];
  children: ReactNode;
}) {
  const faqData = genericFaqStructuredData(faqs);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={articleStructuredData({ path, headline: title, description, datePublished })} />
      <JsonLd data={articleBreadcrumbStructuredData({ path, title })} />
      {faqData && <JsonLd data={faqData} />}

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-700 dark:text-slate-300">{title}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{description}</p>

      <div className="mt-8 flex flex-col gap-8 text-slate-700 dark:text-slate-300">{children}</div>

      {faqs.length > 0 && (
        <section className="mt-8 flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick questions</h2>
          <dl className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium text-slate-900 dark:text-white">{faq.question}</dt>
                <dd className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-10 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Ready to try it? GOAT PDF&apos;s {cta.toolName} tool is free, with no sign-up required.
        </p>
        <Button href={`/tools/${cta.toolSlug}`} variant="primary" className="shrink-0">
          {cta.label}
        </Button>
      </div>
    </div>
  );
}

export function ArticleSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{heading}</h2>
      <div className="flex flex-col gap-3 leading-relaxed">{children}</div>
    </section>
  );
}

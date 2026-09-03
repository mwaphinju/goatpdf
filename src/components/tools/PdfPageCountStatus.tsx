import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export interface PdfPageCountStatusProps {
  file: File | null;
  pageCount: number | null;
  error: string | null;
  isReading: boolean;
  /** Defaults to English; every existing call site omits this and is unaffected. */
  locale?: Locale;
}

/** The "Reading your PDF… / This PDF has N pages / couldn't read it" block shared by every page-aware tool. */
export function PdfPageCountStatus({ file, pageCount, error, isReading, locale = DEFAULT_LOCALE }: PdfPageCountStatusProps) {
  if (!file) return null;
  const t = getDictionary(locale);
  const template = pageCount === 1 ? t.pageStatus.pageCountSingular : t.pageStatus.pageCountPlural;
  const [before, after] = template.split("{count}");

  return (
    <>
      {isReading && <p className="text-sm text-slate-600 dark:text-slate-400">{t.pageStatus.reading}</p>}

      {pageCount !== null && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {before}
          <span className="font-medium">{pageCount}</span>
          {after}
        </p>
      )}

      {error && <ErrorMessage tone="info" message={error} />}
    </>
  );
}

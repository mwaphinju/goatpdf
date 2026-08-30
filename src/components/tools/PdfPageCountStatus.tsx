import { ErrorMessage } from "@/components/ui/ErrorMessage";

export interface PdfPageCountStatusProps {
  file: File | null;
  pageCount: number | null;
  error: string | null;
  isReading: boolean;
}

/** The "Reading your PDF… / This PDF has N pages / couldn't read it" block shared by every page-aware tool. */
export function PdfPageCountStatus({ file, pageCount, error, isReading }: PdfPageCountStatusProps) {
  if (!file) return null;

  return (
    <>
      {isReading && <p className="text-sm text-slate-500">Reading your PDF…</p>}

      {pageCount !== null && (
        <p className="text-sm text-slate-600">
          This PDF has <span className="font-medium">{pageCount}</span> page{pageCount === 1 ? "" : "s"}.
        </p>
      )}

      {error && <ErrorMessage tone="info" message={error} />}
    </>
  );
}

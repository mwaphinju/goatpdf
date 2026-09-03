"use client";

import { useEffect, useState } from "react";

export interface PdfPageCountState {
  pageCount: number | null;
  error: string | null;
  isReading: boolean;
}

/**
 * Reads a PDF's page count entirely in the browser (via a dynamically
 * imported pdf-lib) so a tool can show it without ever uploading the file.
 * Shared by every tool that needs page-aware controls (Split, Rotate,
 * Delete Pages) — the server still validates authoritatively; this is UX
 * only.
 */
export function usePdfPageCount(file: File | null): PdfPageCountState {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    (async () => {
      setIsReading(true);
      setPageCount(null);
      setError(null);

      try {
        const { PDFDocument } = await import("pdf-lib");
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        if (!cancelled) setPageCount(doc.getPageCount());
      } catch {
        if (!cancelled) {
          setError("We couldn't read this PDF's page count. It may be corrupted or password protected.");
        }
      } finally {
        if (!cancelled) setIsReading(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsReading(false);
    };
  }, [file]);

  return { pageCount, error, isReading };
}

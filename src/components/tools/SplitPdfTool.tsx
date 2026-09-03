"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { PdfPageCountStatus } from "@/components/tools/PdfPageCountStatus";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { trackProcessingCompleted, trackProcessingFailed, trackProcessingStarted } from "@/lib/analytics/ga";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import { usePdfPageCount } from "@/lib/hooks/usePdfPageCount";
import { parsePageRanges } from "@/lib/pdf/pageRanges";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

const TOOL_NAME = "split-pdf";

type Mode = "all-pages" | "ranges";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const COPY = {
  en: {
    uploadLabel: "Drag and drop your PDF file here",
    uploadHint: "Up to 50 MB. Files are processed privately and deleted automatically.",
    splitting: "Splitting your PDF…",
    splitFailed: "Something went wrong while splitting your file. Please try again.",
    howToSplit: "How should we split it?",
    splitAllTitle: "Split into individual pages",
    splitAllDescription: "Every page becomes its own PDF, delivered as a ZIP file.",
    extractTitle: "Extract specific pages",
    extractDescription: "Choose which pages to keep, in one new PDF.",
    needsReadableCount: " (needs a readable page count)",
    pagesToExtract: "Pages to extract",
    rangesPlaceholder: "e.g. 1-3, 5, 7-9",
    rangesHint: "Separate pages or ranges with commas, e.g. 1-3, 5, 7-9.",
    extractAction: "Extract Pages",
    splitAction: "Split PDF",
  },
  de: {
    uploadLabel: "Ziehe deine PDF-Datei hierher",
    uploadHint: "Bis zu 50 MB. Dateien werden vertraulich verarbeitet und automatisch gelöscht.",
    splitting: "Deine PDF-Datei wird geteilt…",
    splitFailed: "Beim Teilen deiner Datei ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    howToSplit: "Wie möchtest du die Datei teilen?",
    splitAllTitle: "In einzelne Seiten teilen",
    splitAllDescription: "Jede Seite wird zu einer eigenen PDF-Datei, geliefert als ZIP-Datei.",
    extractTitle: "Bestimmte Seiten extrahieren",
    extractDescription: "Wähle aus, welche Seiten in einer neuen PDF-Datei erhalten bleiben sollen.",
    needsReadableCount: " (benötigt eine lesbare Seitenzahl)",
    pagesToExtract: "Zu extrahierende Seiten",
    rangesPlaceholder: "z. B. 1-3, 5, 7-9",
    rangesHint: "Trenne Seiten oder Bereiche mit Kommas, z. B. 1-3, 5, 7-9.",
    extractAction: "Seiten extrahieren",
    splitAction: "PDF teilen",
  },
} as const;

export function SplitPdfTool({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const copy = COPY[locale];
  const t = getDictionary(locale);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("all-pages");
  const [rangesInput, setRangesInput] = useState("");
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;
  const { pageCount, error: pageCountError, isReading: isReadingFile } = usePdfPageCount(file);

  const rangesValidation =
    file && mode === "ranges" && pageCount !== null ? parsePageRanges(rangesInput, pageCount, locale) : null;
  const rangesError = rangesValidation && !rangesValidation.ok ? rangesValidation.error : null;

  const canSplit =
    file !== null &&
    !isReadingFile &&
    (mode === "all-pages" ? pageCount !== null || pageCountError !== null : rangesValidation?.ok === true);

  function reset() {
    setFiles([]);
    setMode("all-pages");
    setRangesInput("");
    setFlow({ status: "idle" });
  }

  async function handleSplit() {
    if (!file) return;
    setFlow({ status: "processing" });
    trackProcessingStarted(TOOL_NAME, 1);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("mode", mode);
      if (mode === "ranges") formData.append("ranges", rangesInput);

      const response = await fetch("/api/split-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        trackProcessingFailed(TOOL_NAME);
        setFlow({
          status: "error",
          message: data?.message ?? copy.splitFailed,
        });
        return;
      }

      trackProcessingCompleted(TOOL_NAME);
      setFlow({
        status: "success",
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
        fileSizeLabel: formatBytes(data.fileSize),
      });
    } catch {
      trackProcessingFailed(TOOL_NAME);
      setFlow({
        status: "error",
        message: t.errors.networkError,
      });
    }
  }

  async function handleDownload() {
    if (flow.status !== "success") return;
    const result = await downloadFile(flow.downloadUrl, flow.fileName, TOOL_NAME);
    if (!result.ok) setFlow({ status: "error", message: result.message });
  }

  if (flow.status === "success") {
    return (
      <ResultDownload
        fileName={flow.fileName}
        fileSizeLabel={flow.fileSizeLabel}
        downloadUrl={flow.downloadUrl}
        onDownload={handleDownload}
        onReset={reset}
        locale={locale}
      />
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label={copy.splitting} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="split-pdf"
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label={copy.uploadLabel}
        hint={copy.uploadHint}
        locale={locale}
      />

      <PdfPageCountStatus
        file={file}
        pageCount={pageCount}
        error={pageCountError}
        isReading={isReadingFile}
        locale={locale}
      />

      {file && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-slate-900 dark:text-white">{copy.howToSplit}</legend>

          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="split-mode"
              value="all-pages"
              checked={mode === "all-pages"}
              onChange={() => setMode("all-pages")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-slate-900 dark:text-white">{copy.splitAllTitle}</span>
              <span className="block text-slate-600 dark:text-slate-400">{copy.splitAllDescription}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="split-mode"
              value="ranges"
              checked={mode === "ranges"}
              onChange={() => setMode("ranges")}
              disabled={pageCount === null}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-slate-900 dark:text-white">{copy.extractTitle}</span>
              <span className="block text-slate-600 dark:text-slate-400">
                {copy.extractDescription}
                {pageCount === null && copy.needsReadableCount}
              </span>
            </span>
          </label>

          {mode === "ranges" && (
            <div className="ml-6 flex flex-col gap-1">
              <label htmlFor="page-ranges" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {copy.pagesToExtract}
              </label>
              <input
                id="page-ranges"
                type="text"
                value={rangesInput}
                onChange={(event) => setRangesInput(event.target.value)}
                placeholder={copy.rangesPlaceholder}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                aria-invalid={rangesError ? true : undefined}
                aria-describedby="page-ranges-hint"
              />
              <p id="page-ranges-hint" className="text-xs text-slate-600 dark:text-slate-400">
                {copy.rangesHint}
              </p>
              {rangesError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {rangesError}
                </p>
              )}
            </div>
          )}
        </fieldset>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={mode === "ranges" ? copy.extractAction : copy.splitAction}
        onAction={handleSplit}
        disabled={!canSplit}
        showReset={file !== null}
        onReset={reset}
        locale={locale}
      />
    </div>
  );
}

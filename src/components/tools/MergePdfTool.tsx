"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { ReorderableFileList } from "@/components/tools/ReorderableFileList";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { trackProcessingCompleted, trackProcessingFailed, trackProcessingStarted } from "@/lib/analytics/ga";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localizeProcessingErrorMessage } from "@/i18n/processingErrors";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const TOOL_NAME = "merge-pdf";
const MIN_FILES = 2;
const MAX_FILES = 20;

const COPY = {
  en: {
    uploadLabel: "Drag and drop your PDF files here",
    uploadHint: (max: number) => `Up to ${max} files, 50 MB each. Files are processed privately and deleted automatically.`,
    filesToMerge: "Files to merge, in order",
    addAtLeast: (min: number) => `Add at least ${min} PDF files to merge.`,
    merging: (count: number) => `Merging ${count} PDFs…`,
    mergeFailed: "Something went wrong while merging your files. Please try again.",
    mergeAction: (count: number) => (count > 0 ? `Merge ${count} PDFs` : "Merge PDFs"),
  },
  de: {
    uploadLabel: "Ziehe deine PDF-Dateien hierher",
    uploadHint: (max: number) => `Bis zu ${max} Dateien, je 50 MB. Dateien werden vertraulich verarbeitet und automatisch gelöscht.`,
    filesToMerge: "Dateien zum Zusammenfügen, in der gewünschten Reihenfolge",
    addAtLeast: (min: number) => `Füge mindestens ${min} PDF-Dateien hinzu, um sie zusammenzufügen.`,
    merging: (count: number) => `${count} PDFs werden zusammengefügt…`,
    mergeFailed: "Beim Zusammenfügen deiner Dateien ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    mergeAction: (count: number) => (count > 0 ? `${count} PDFs zusammenfügen` : "PDFs zusammenfügen"),
  },
} as const;

export function MergePdfTool({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const copy = COPY[locale];
  const t = getDictionary(locale);
  const [files, setFiles] = useState<File[]>([]);
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  function reset() {
    setFiles([]);
    setFlow({ status: "idle" });
  }

  async function handleMerge() {
    setFlow({ status: "processing" });
    trackProcessingStarted(TOOL_NAME, files.length);

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);

      const response = await fetch("/api/merge-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        trackProcessingFailed(TOOL_NAME);
        setFlow({
          status: "error",
          message: data ? localizeProcessingErrorMessage(data.code, data.message, locale) : copy.mergeFailed,
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
    return <ProcessingState label={copy.merging(files.length)} />;
  }

  const canMerge = files.length >= MIN_FILES && files.length <= MAX_FILES;

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="merge-pdf"
        multiple
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        hideFileList
        label={copy.uploadLabel}
        hint={copy.uploadHint(MAX_FILES)}
        locale={locale}
      />

      <ReorderableFileList files={files} onChange={setFiles} label={copy.filesToMerge} locale={locale} />

      {files.length > 0 && files.length < MIN_FILES && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{copy.addAtLeast(MIN_FILES)}</p>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={copy.mergeAction(files.length)}
        onAction={handleMerge}
        disabled={!canMerge}
        showReset={files.length > 0}
        onReset={reset}
        locale={locale}
      />
    </div>
  );
}

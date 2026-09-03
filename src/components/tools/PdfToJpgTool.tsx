"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { PageSelector } from "@/components/tools/PageSelector";
import { PdfPageCountStatus } from "@/components/tools/PdfPageCountStatus";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { trackProcessingCompleted, trackProcessingFailed, trackProcessingStarted } from "@/lib/analytics/ga";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import { usePdfPageCount } from "@/lib/hooks/usePdfPageCount";
import type { ImageQuality } from "@/lib/pdf/pdfToJpg";

const TOOL_NAME = "pdf-to-jpg";

type Scope = "all" | "selected";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const QUALITY_OPTIONS: { value: ImageQuality; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Smallest files, best for quick previews." },
  { value: "medium", label: "Medium", description: "Balanced size and clarity." },
  { value: "high", label: "High", description: "Sharpest images, larger files." },
];

export function PdfToJpgTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<ImageQuality>("medium");
  const [scope, setScope] = useState<Scope>("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;
  const { pageCount, error: pageCountError, isReading: isReadingFile } = usePdfPageCount(file);

  const canConvert =
    file !== null &&
    !isReadingFile &&
    (scope === "all" ? pageCount !== null || pageCountError !== null : selectedPages.size > 0);

  function reset() {
    setFiles([]);
    setQuality("medium");
    setScope("all");
    setSelectedPages(new Set());
    setFlow({ status: "idle" });
  }

  async function handleConvert() {
    if (!file) return;
    setFlow({ status: "processing" });
    trackProcessingStarted(TOOL_NAME, 1);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("quality", quality);
      formData.append("pages", scope === "all" ? "all" : JSON.stringify(Array.from(selectedPages)));

      const response = await fetch("/api/pdf-to-jpg", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        trackProcessingFailed(TOOL_NAME);
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while converting your PDF. Please try again.",
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
        message: "Network error. Please check your connection and try again.",
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
      />
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label="Converting your PDF to images…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="pdf-to-jpg"
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      <PdfPageCountStatus file={file} pageCount={pageCount} error={pageCountError} isReading={isReadingFile} />

      {file && (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900 dark:text-white">Image quality</legend>
            {QUALITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:has-[:checked]:border-emerald-500 dark:has-[:checked]:bg-emerald-950"
              >
                <input
                  type="radio"
                  name="jpg-quality"
                  value={option.value}
                  checked={quality === option.value}
                  onChange={() => setQuality(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-slate-900 dark:text-white">{option.label}</span>
                  <span className="block text-slate-600 dark:text-slate-400">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900 dark:text-white">Which pages?</legend>

            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="convert-scope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="mt-1"
              />
              <span className="font-medium text-slate-900 dark:text-white">All pages</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="convert-scope"
                value="selected"
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                disabled={pageCount === null}
                className="mt-1"
              />
              <span className="font-medium text-slate-900 dark:text-white">
                Select pages
                {pageCount === null && (
                  <span className="font-normal text-slate-600 dark:text-slate-400"> (needs a readable page count)</span>
                )}
              </span>
            </label>

            {scope === "selected" && pageCount !== null && (
              <div className="ml-6">
                <PageSelector
                  pageCount={pageCount}
                  selected={selectedPages}
                  onChange={setSelectedPages}
                  label="Pages to convert"
                />
              </div>
            )}
          </fieldset>
        </>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel="Convert to JPG"
        onAction={handleConvert}
        disabled={!canConvert}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

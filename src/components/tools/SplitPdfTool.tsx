"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { PdfPageCountStatus } from "@/components/tools/PdfPageCountStatus";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import { usePdfPageCount } from "@/lib/hooks/usePdfPageCount";
import { parsePageRanges } from "@/lib/pdf/pageRanges";

type Mode = "all-pages" | "ranges";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

export function SplitPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("all-pages");
  const [rangesInput, setRangesInput] = useState("");
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;
  const { pageCount, error: pageCountError, isReading: isReadingFile } = usePdfPageCount(file);

  const rangesValidation =
    file && mode === "ranges" && pageCount !== null ? parsePageRanges(rangesInput, pageCount) : null;
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

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("mode", mode);
      if (mode === "ranges") formData.append("ranges", rangesInput);

      const response = await fetch("/api/split-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while splitting your file. Please try again.",
        });
        return;
      }

      setFlow({
        status: "success",
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
        fileSizeLabel: formatBytes(data.fileSize),
      });
    } catch {
      setFlow({
        status: "error",
        message: "Network error — please check your connection and try again.",
      });
    }
  }

  async function handleDownload() {
    if (flow.status !== "success") return;
    const result = await downloadFile(flow.downloadUrl, flow.fileName);
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
    return <ProcessingState label="Splitting your PDF…" />;
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
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      <PdfPageCountStatus file={file} pageCount={pageCount} error={pageCountError} isReading={isReadingFile} />

      {file && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-slate-900">How should we split it?</legend>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="split-mode"
              value="all-pages"
              checked={mode === "all-pages"}
              onChange={() => setMode("all-pages")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-slate-900">Split into individual pages</span>
              <span className="block text-slate-500">
                Every page becomes its own PDF, delivered as a ZIP file.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
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
              <span className="block font-medium text-slate-900">Extract specific pages</span>
              <span className="block text-slate-500">
                Choose which pages to keep, in one new PDF.
                {pageCount === null && " (needs a readable page count)"}
              </span>
            </span>
          </label>

          {mode === "ranges" && (
            <div className="ml-6 flex flex-col gap-1">
              <label htmlFor="page-ranges" className="text-sm font-medium text-slate-700">
                Pages to extract
              </label>
              <input
                id="page-ranges"
                type="text"
                value={rangesInput}
                onChange={(event) => setRangesInput(event.target.value)}
                placeholder="e.g. 1-3, 5, 7-9"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-invalid={rangesError ? true : undefined}
                aria-describedby="page-ranges-hint"
              />
              <p id="page-ranges-hint" className="text-xs text-slate-500">
                Separate pages or ranges with commas, e.g. 1-3, 5, 7-9.
              </p>
              {rangesError && (
                <p role="alert" className="text-sm text-red-600">
                  {rangesError}
                </p>
              )}
            </div>
          )}
        </fieldset>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={mode === "ranges" ? "Extract Pages" : "Split PDF"}
        onAction={handleSplit}
        disabled={!canSplit}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { PageSelector } from "@/components/tools/PageSelector";
import { formatBytes } from "@/lib/format";
import { usePdfPageCount } from "@/lib/hooks/usePdfPageCount";
import type { ImageQuality } from "@/lib/pdf/pdfToJpg";

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

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("quality", quality);
      formData.append("pages", scope === "all" ? "all" : JSON.stringify(Array.from(selectedPages)));

      const response = await fetch("/api/pdf-to-jpg", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while converting your PDF. Please try again.",
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

    try {
      const response = await fetch(flow.downloadUrl);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setFlow({
          status: "error",
          message: data?.message ?? "This download link has expired. Please try again.",
        });
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = flow.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setFlow({ status: "error", message: "Network error while downloading. Please try again." });
    }
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
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      {file && isReadingFile && <p className="text-sm text-slate-500">Reading your PDF…</p>}

      {file && pageCount !== null && (
        <p className="text-sm text-slate-600">
          This PDF has <span className="font-medium">{pageCount}</span> page{pageCount === 1 ? "" : "s"}.
        </p>
      )}

      {file && pageCountError && <ErrorMessage tone="info" message={pageCountError} />}

      {file && (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900">Image quality</legend>
            {QUALITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
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
                  <span className="block font-medium text-slate-900">{option.label}</span>
                  <span className="block text-slate-500">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900">Which pages?</legend>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="convert-scope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="mt-1"
              />
              <span className="font-medium text-slate-900">All pages</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="convert-scope"
                value="selected"
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                disabled={pageCount === null}
                className="mt-1"
              />
              <span className="font-medium text-slate-900">
                Select pages
                {pageCount === null && <span className="font-normal text-slate-500"> (needs a readable page count)</span>}
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

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={!canConvert} onClick={handleConvert}>
          Convert to JPG
        </Button>
        {file && (
          <Button size="lg" variant="secondary" onClick={reset}>
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}

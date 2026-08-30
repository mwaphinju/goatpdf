"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { ReorderableFileList } from "@/components/tools/ReorderableFileList";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import type { Margin, Orientation, PageSize } from "@/lib/pdf/jpgToPdf";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const MAX_FILES = 30;

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string; description: string }[] = [
  { value: "a4", label: "A4", description: "Standard international page size." },
  { value: "letter", label: "Letter", description: "Standard US page size." },
  { value: "fit", label: "Fit to image", description: "Each page matches its image's own proportions." },
];

const MARGIN_OPTIONS: { value: Margin; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
];

export function JpgToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState<Margin>("normal");
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  function reset() {
    setFiles([]);
    setPageSize("a4");
    setOrientation("portrait");
    setMargin("normal");
    setFlow({ status: "idle" });
  }

  async function handleConvert() {
    if (files.length === 0) return;
    setFlow({ status: "processing" });

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      formData.append("pageSize", pageSize);
      formData.append("orientation", orientation);
      formData.append("margin", margin);

      const response = await fetch("/api/jpg-to-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while converting your images. Please try again.",
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
    return <ProcessingState label="Converting your images…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="image/jpeg,image/png"
        toolSlug="jpg-to-pdf"
        multiple
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        hideFileList
        label="Drag and drop your JPG or PNG images here"
        hint={`Up to ${MAX_FILES} images, 50 MB each. Files are processed privately and deleted automatically.`}
      />

      <ReorderableFileList files={files} onChange={setFiles} label="Files to convert, in order" />

      {files.length > 0 && (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900">Page size</legend>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="page-size"
                  value={option.value}
                  checked={pageSize === option.value}
                  onChange={() => setPageSize(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-slate-900">{option.label}</span>
                  <span className="block text-slate-500">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-900">Orientation</legend>
            <div className="flex gap-3">
              {(["portrait", "landscape"] as const).map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 capitalize has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:disabled]:opacity-40"
                >
                  <input
                    type="radio"
                    name="orientation"
                    value={value}
                    checked={orientation === value}
                    onChange={() => setOrientation(value)}
                    disabled={pageSize === "fit"}
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-900">Margins</legend>
            <div className="flex gap-3">
              {MARGIN_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                >
                  <input
                    type="radio"
                    name="margin"
                    value={option.value}
                    checked={margin === option.value}
                    onChange={() => setMargin(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel="Convert to PDF"
        onAction={handleConvert}
        disabled={files.length === 0}
        showReset={files.length > 0}
        onReset={reset}
      />
    </div>
  );
}

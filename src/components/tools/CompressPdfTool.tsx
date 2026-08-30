"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import type { CompressionPreset } from "@/lib/pdf/compressPdf";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | {
      status: "success";
      downloadUrl: string;
      fileName: string;
      originalSize: number;
      compressedSize: number;
    }
  | { status: "error"; message: string };

const PRESET_OPTIONS: { value: CompressionPreset; label: string; description: string }[] = [
  { value: "recommended", label: "Recommended", description: "Balanced compression for everyday sharing." },
  {
    value: "high-quality",
    label: "High Quality",
    description: "Prioritizes image quality — expect a smaller size reduction.",
  },
  {
    value: "maximum-compression",
    label: "Maximum Compression",
    description: "Smallest possible file size — more visible quality loss on images.",
  },
];

export function CompressPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>("recommended");
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;

  function reset() {
    setFiles([]);
    setPreset("recommended");
    setFlow({ status: "idle" });
  }

  async function handleCompress() {
    if (!file) return;
    const originalSize = file.size;
    setFlow({ status: "processing" });

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("preset", preset);

      const response = await fetch("/api/compress-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while compressing your file. Please try again.",
        });
        return;
      }

      setFlow({
        status: "success",
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
        originalSize,
        compressedSize: data.fileSize,
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
    const spaceSaved = Math.max(0, flow.originalSize - flow.compressedSize);
    const percentReduction =
      flow.originalSize > 0 ? Math.round((spaceSaved / flow.originalSize) * 100) : 0;

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Original size</dt>
              <dd className="text-base font-semibold text-slate-900">{formatBytes(flow.originalSize)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Compressed size</dt>
              <dd className="text-base font-semibold text-slate-900">{formatBytes(flow.compressedSize)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Space saved</dt>
              <dd className="text-base font-semibold text-slate-900">{formatBytes(spaceSaved)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reduction</dt>
              <dd className="text-base font-semibold text-emerald-700">{percentReduction}%</dd>
            </div>
          </dl>
          {percentReduction === 0 && (
            <p className="mt-4 text-sm text-slate-600">
              This PDF was already well optimized — we couldn&apos;t shrink it further without a real loss
              in quality, so we kept your original file intact.
            </p>
          )}
        </div>

        <ResultDownload
          fileName={flow.fileName}
          fileSizeLabel={formatBytes(flow.compressedSize)}
          downloadUrl={flow.downloadUrl}
          onDownload={handleDownload}
          onReset={reset}
        />
      </div>
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label="Compressing your PDF…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="compress-pdf"
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      {file && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-slate-900">Compression level</legend>
          {PRESET_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
            >
              <input
                type="radio"
                name="compress-preset"
                value={option.value}
                checked={preset === option.value}
                onChange={() => setPreset(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-slate-900">{option.label}</span>
                <span className="block text-slate-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel="Compress PDF"
        onAction={handleCompress}
        disabled={!file}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

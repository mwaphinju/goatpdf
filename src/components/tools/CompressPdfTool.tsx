"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { trackProcessingCompleted, trackProcessingFailed, trackProcessingStarted } from "@/lib/analytics/ga";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import type { CompressionPreset } from "@/lib/pdf/compressPdf";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localizeProcessingErrorMessage } from "@/i18n/processingErrors";

const TOOL_NAME = "compress-pdf";

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

const COPY = {
  en: {
    uploadLabel: "Drag and drop your PDF file here",
    uploadHint: "Up to 50 MB. Files are processed privately and deleted automatically.",
    compressing: "Compressing your PDF…",
    compressFailed: "Something went wrong while compressing your file. Please try again.",
    compressionLevel: "Compression level",
    presets: [
      { value: "recommended" as const, label: "Recommended", description: "Balanced compression for everyday sharing." },
      { value: "high-quality" as const, label: "High Quality", description: "Prioritizes image quality: expect a smaller size reduction." },
      { value: "maximum-compression" as const, label: "Maximum Compression", description: "Smallest possible file size: more visible quality loss on images." },
    ],
    originalSize: "Original size",
    compressedSize: "Compressed size",
    spaceSaved: "Space saved",
    reduction: "Reduction",
    alreadyOptimized:
      "This PDF was already well optimized. We couldn't shrink it further without a real loss in quality, so we kept your original file intact.",
    compressAction: "Compress PDF",
  },
  de: {
    uploadLabel: "Ziehe deine PDF-Datei hierher",
    uploadHint: "Bis zu 50 MB. Dateien werden vertraulich verarbeitet und automatisch gelöscht.",
    compressing: "Deine PDF-Datei wird komprimiert…",
    compressFailed: "Beim Komprimieren deiner Datei ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    compressionLevel: "Komprimierungsstufe",
    presets: [
      { value: "recommended" as const, label: "Empfohlen", description: "Ausgewogene Komprimierung für den alltäglichen Versand." },
      { value: "high-quality" as const, label: "Hohe Qualität", description: "Priorisiert die Bildqualität: geringere Größenreduzierung." },
      { value: "maximum-compression" as const, label: "Maximale Komprimierung", description: "Kleinstmögliche Dateigröße: sichtbarer Qualitätsverlust bei Bildern." },
    ],
    originalSize: "Ursprüngliche Größe",
    compressedSize: "Komprimierte Größe",
    spaceSaved: "Eingesparter Speicherplatz",
    reduction: "Reduzierung",
    alreadyOptimized:
      "Diese PDF-Datei war bereits gut optimiert. Wir konnten sie ohne echten Qualitätsverlust nicht weiter verkleinern, daher haben wir deine Originaldatei unverändert gelassen.",
    compressAction: "PDF komprimieren",
  },
} as const;

export function CompressPdfTool({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const copy = COPY[locale];
  const t = getDictionary(locale);
  const PRESET_OPTIONS = copy.presets;
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
    trackProcessingStarted(TOOL_NAME, 1);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("preset", preset);

      const response = await fetch("/api/compress-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        trackProcessingFailed(TOOL_NAME);
        setFlow({
          status: "error",
          message: data ? localizeProcessingErrorMessage(data.code, data.message, locale) : copy.compressFailed,
        });
        return;
      }

      trackProcessingCompleted(TOOL_NAME);
      setFlow({
        status: "success",
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
        originalSize,
        compressedSize: data.fileSize,
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
    const spaceSaved = Math.max(0, flow.originalSize - flow.compressedSize);
    const percentReduction =
      flow.originalSize > 0 ? Math.round((spaceSaved / flow.originalSize) * 100) : 0;

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-600 dark:text-slate-400">{copy.originalSize}</dt>
              <dd className="text-base font-semibold text-slate-900 dark:text-white">{formatBytes(flow.originalSize)}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">{copy.compressedSize}</dt>
              <dd className="text-base font-semibold text-slate-900 dark:text-white">{formatBytes(flow.compressedSize)}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">{copy.spaceSaved}</dt>
              <dd className="text-base font-semibold text-slate-900 dark:text-white">{formatBytes(spaceSaved)}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">{copy.reduction}</dt>
              <dd className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{percentReduction}%</dd>
            </div>
          </dl>
          {percentReduction === 0 && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{copy.alreadyOptimized}</p>
          )}
        </div>

        <ResultDownload
          fileName={flow.fileName}
          fileSizeLabel={formatBytes(flow.compressedSize)}
          downloadUrl={flow.downloadUrl}
          onDownload={handleDownload}
          onReset={reset}
          locale={locale}
        />
      </div>
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label={copy.compressing} />;
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
        label={copy.uploadLabel}
        hint={copy.uploadHint}
        locale={locale}
      />

      {file && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-slate-900 dark:text-white">{copy.compressionLevel}</legend>
          {PRESET_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:has-[:checked]:border-emerald-500 dark:has-[:checked]:bg-emerald-950"
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
                <span className="block font-medium text-slate-900 dark:text-white">{option.label}</span>
                <span className="block text-slate-600 dark:text-slate-400">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={copy.compressAction}
        onAction={handleCompress}
        disabled={!file}
        showReset={file !== null}
        onReset={reset}
        locale={locale}
      />
    </div>
  );
}

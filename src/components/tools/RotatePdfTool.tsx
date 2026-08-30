"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { PageSelector } from "@/components/tools/PageSelector";
import { PdfPageCountStatus } from "@/components/tools/PdfPageCountStatus";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { downloadFile } from "@/lib/downloadFile";
import { formatBytes } from "@/lib/format";
import { usePdfPageCount } from "@/lib/hooks/usePdfPageCount";
import type { RotationAngle } from "@/lib/pdf/rotatePdf";

type Scope = "all" | "selected";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const ANGLES: RotationAngle[] = [90, 180, 270];

export function RotatePdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [scope, setScope] = useState<Scope>("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;
  const { pageCount, error: pageCountError, isReading: isReadingFile } = usePdfPageCount(file);

  const canRotate =
    file !== null &&
    !isReadingFile &&
    (scope === "all" ? pageCount !== null || pageCountError !== null : selectedPages.size > 0);

  function reset() {
    setFiles([]);
    setAngle(90);
    setScope("all");
    setSelectedPages(new Set());
    setFlow({ status: "idle" });
  }

  async function handleRotate() {
    if (!file) return;
    setFlow({ status: "processing" });

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("angle", String(angle));
      formData.append("pages", scope === "all" ? "all" : JSON.stringify(Array.from(selectedPages)));

      const response = await fetch("/api/rotate-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while rotating your file. Please try again.",
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
    return <ProcessingState label="Rotating your PDF…" />;
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

      <PdfPageCountStatus file={file} pageCount={pageCount} error={pageCountError} isReading={isReadingFile} />

      {file && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-900">Rotation angle</legend>
            <div className="flex gap-3">
              {ANGLES.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                >
                  <input
                    type="radio"
                    name="rotate-angle"
                    value={value}
                    checked={angle === value}
                    onChange={() => setAngle(value)}
                  />
                  {value}°
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-slate-900">Which pages?</legend>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="rotate-scope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="mt-1"
              />
              <span className="font-medium text-slate-900">Rotate every page</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="rotate-scope"
                value="selected"
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                disabled={pageCount === null}
                className="mt-1"
              />
              <span className="font-medium text-slate-900">
                Choose specific pages
                {pageCount === null && <span className="font-normal text-slate-500"> (needs a readable page count)</span>}
              </span>
            </label>

            {scope === "selected" && pageCount !== null && (
              <div className="ml-6">
                <PageSelector
                  pageCount={pageCount}
                  selected={selectedPages}
                  onChange={setSelectedPages}
                  label="Pages to rotate"
                />
              </div>
            )}
          </fieldset>
        </>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel="Rotate PDF"
        onAction={handleRotate}
        disabled={!canRotate}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import { ChevronDownIcon, FileIcon, GripIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { ResultDownload } from "@/components/ui/ResultDownload";
import { UploadZone } from "@/components/ui/UploadZone";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const MIN_FILES = 2;
const MAX_FILES = 20;

export function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function moveFile(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...files];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setFiles(next);
    setDragIndex(null);
  }

  function reset() {
    setFiles([]);
    setFlow({ status: "idle" });
  }

  async function handleMerge() {
    setFlow({ status: "processing" });

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);

      const response = await fetch("/api/merge-pdf", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while merging your files. Please try again.",
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
          message: data?.message ?? "This download link has expired. Please merge your files again.",
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
    return <ProcessingState label={`Merging ${files.length} PDFs…`} />;
  }

  const canMerge = files.length >= MIN_FILES && files.length <= MAX_FILES;

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        multiple
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        hideFileList
        label="Drag and drop your PDF files here"
        hint={`Up to ${MAX_FILES} files, 50 MB each. Files are processed privately and deleted automatically.`}
      />

      {files.length > 0 && (
        <ol aria-label="Files to merge, in order" className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event: DragEvent<HTMLLIElement>) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                dragIndex === index && "opacity-50",
              )}
            >
              <GripIcon className="h-4 w-4 shrink-0 cursor-grab text-slate-300" />
              <span className="w-5 shrink-0 text-center text-xs font-medium text-slate-400">
                {index + 1}
              </span>
              <FileIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{file.name}</span>
              <span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>

              <button
                type="button"
                onClick={() => moveFile(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${file.name} up`}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronDownIcon className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => moveFile(index, 1)}
                disabled={index === files.length - 1}
                aria-label={`Move ${file.name} down`}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {files.length > 0 && files.length < MIN_FILES && (
        <p className="text-sm text-slate-500">Add at least {MIN_FILES} PDF files to merge.</p>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={!canMerge} onClick={handleMerge}>
          {files.length > 0 ? `Merge ${files.length} PDFs` : "Merge PDFs"}
        </Button>
        {files.length > 0 && (
          <Button size="lg" variant="secondary" onClick={reset}>
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}

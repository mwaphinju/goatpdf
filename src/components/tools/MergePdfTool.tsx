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
    return <ProcessingState label={`Merging ${files.length} PDFs…`} />;
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
        label="Drag and drop your PDF files here"
        hint={`Up to ${MAX_FILES} files, 50 MB each. Files are processed privately and deleted automatically.`}
      />

      <ReorderableFileList files={files} onChange={setFiles} label="Files to merge, in order" />

      {files.length > 0 && files.length < MIN_FILES && (
        <p className="text-sm text-slate-500">Add at least {MIN_FILES} PDF files to merge.</p>
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={files.length > 0 ? `Merge ${files.length} PDFs` : "Merge PDFs"}
        onAction={handleMerge}
        disabled={!canMerge}
        showReset={files.length > 0}
        onReset={reset}
      />
    </div>
  );
}

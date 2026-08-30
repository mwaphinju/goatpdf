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

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

export function DeletePagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;
  const { pageCount, error: pageCountError, isReading: isReadingFile } = usePdfPageCount(file);

  const deletingEverything = pageCount !== null && selectedPages.size >= pageCount;
  const canDelete =
    file !== null && !isReadingFile && pageCount !== null && selectedPages.size > 0 && !deletingEverything;

  function reset() {
    setFiles([]);
    setSelectedPages(new Set());
    setFlow({ status: "idle" });
  }

  async function handleDelete() {
    if (!file) return;
    setFlow({ status: "processing" });

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("pages", JSON.stringify(Array.from(selectedPages)));

      const response = await fetch("/api/delete-pdf-pages", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while deleting pages. Please try again.",
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
    return <ProcessingState label="Removing pages…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="delete-pdf-pages"
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      <PdfPageCountStatus file={file} pageCount={pageCount} error={pageCountError} isReading={isReadingFile} />

      {file && pageCount !== null && (
        <PageSelector
          pageCount={pageCount}
          selected={selectedPages}
          onChange={setSelectedPages}
          label="Pages to delete"
        />
      )}

      {deletingEverything && (
        <ErrorMessage
          tone="info"
          message="You can't delete every page — deselect at least one to keep."
        />
      )}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={
          selectedPages.size > 0 ? `Delete ${selectedPages.size} Page${selectedPages.size === 1 ? "" : "s"}` : "Delete Pages"
        }
        onAction={handleDelete}
        disabled={!canDelete}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

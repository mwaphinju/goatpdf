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
    return <ProcessingState label="Removing pages…" />;
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

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={!canDelete} onClick={handleDelete}>
          {selectedPages.size > 0 ? `Delete ${selectedPages.size} Page${selectedPages.size === 1 ? "" : "s"}` : "Delete Pages"}
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

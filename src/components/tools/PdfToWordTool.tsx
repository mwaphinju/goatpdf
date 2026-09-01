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

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const TOOL_NAME = "pdf-to-word";

const FORMATTING_NOTICE =
  "Conversion quality depends on your PDF. Complex layouts, tables, unusual fonts, and images may not come out exactly as they looked in the original — always review the converted document before using it.";

export function PdfToWordTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  const file = files[0] ?? null;

  function reset() {
    setFiles([]);
    setFlow({ status: "idle" });
  }

  async function handleConvert() {
    if (!file) return;
    setFlow({ status: "processing" });
    trackProcessingStarted(TOOL_NAME, 1);

    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/pdf-to-word", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        trackProcessingFailed(TOOL_NAME);
        setFlow({
          status: "error",
          message: data?.message ?? "Something went wrong while converting your PDF. Please try again.",
        });
        return;
      }

      trackProcessingCompleted(TOOL_NAME);
      setFlow({
        status: "success",
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
        fileSizeLabel: formatBytes(data.fileSize),
      });
    } catch {
      trackProcessingFailed(TOOL_NAME);
      setFlow({
        status: "error",
        message: "Network error — please check your connection and try again.",
      });
    }
  }

  async function handleDownload() {
    if (flow.status !== "success") return;
    const result = await downloadFile(flow.downloadUrl, flow.fileName, TOOL_NAME);
    if (!result.ok) setFlow({ status: "error", message: result.message });
  }

  if (flow.status === "success") {
    return (
      <div className="flex flex-col gap-6">
        <ResultDownload
          fileName={flow.fileName}
          fileSizeLabel={flow.fileSizeLabel}
          downloadUrl={flow.downloadUrl}
          onDownload={handleDownload}
          onReset={reset}
        />
        <ErrorMessage tone="info" title="Please double-check the formatting" message={FORMATTING_NOTICE} />
      </div>
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label="Converting your PDF to Word… this can take a little longer than other tools." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept="application/pdf"
        toolSlug="pdf-to-word"
        multiple={false}
        maxSizeMB={50}
        files={files}
        onFilesChange={setFiles}
        label="Drag and drop your PDF file here"
        hint="Up to 50 MB. Files are processed privately and deleted automatically."
      />

      {file && <ErrorMessage tone="info" title="Before you convert" message={FORMATTING_NOTICE} />}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel="Convert to Word"
        onAction={handleConvert}
        disabled={!file}
        showReset={file !== null}
        onReset={reset}
      />
    </div>
  );
}

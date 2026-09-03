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
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localizeProcessingErrorMessage } from "@/i18n/processingErrors";

type FlowState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; downloadUrl: string; fileName: string; fileSizeLabel: string }
  | { status: "error"; message: string };

const TOOL_NAME = "pdf-to-word";

const COPY = {
  en: {
    formattingNotice:
      "Conversion quality depends on your PDF. Complex layouts, tables, unusual fonts, and images may not come out exactly as they looked in the original. Always review the converted document before using it.",
    beforeConvertTitle: "Before you convert",
    afterConvertTitle: "Please double-check the formatting",
    uploadLabel: "Drag and drop your PDF file here",
    uploadHint: "Up to 50 MB. Files are processed privately and deleted automatically.",
    converting: "Converting your PDF to Word… this can take a little longer than other tools.",
    convertFailed: "Something went wrong while converting your PDF. Please try again.",
    convertAction: "Convert to Word",
  },
  de: {
    formattingNotice:
      "Die Konvertierungsqualität hängt von deiner PDF-Datei ab. Komplexe Layouts, Tabellen, ungewöhnliche Schriftarten und Bilder werden möglicherweise nicht exakt wie im Original übernommen. GOAT PDF verfügt aktuell über keine OCR-Funktion, daher lassen sich gescannte oder reine Bild-PDFs unter Umständen nicht in bearbeitbaren Text umwandeln. Überprüfe das konvertierte Dokument vor der Verwendung immer sorgfältig.",
    beforeConvertTitle: "Bevor du konvertierst",
    afterConvertTitle: "Bitte überprüfe die Formatierung",
    uploadLabel: "Ziehe deine PDF-Datei hierher",
    uploadHint: "Bis zu 50 MB. Dateien werden vertraulich verarbeitet und automatisch gelöscht.",
    converting: "Deine PDF-Datei wird in Word umgewandelt… das kann etwas länger dauern als bei anderen Tools.",
    convertFailed: "Bei der Konvertierung deiner PDF-Datei ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    convertAction: "In Word umwandeln",
  },
} as const;

export function PdfToWordTool({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const copy = COPY[locale];
  const t = getDictionary(locale);
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
          message: data ? localizeProcessingErrorMessage(data.code, data.message, locale) : copy.convertFailed,
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
    return (
      <div className="flex flex-col gap-6">
        <ResultDownload
          fileName={flow.fileName}
          fileSizeLabel={flow.fileSizeLabel}
          downloadUrl={flow.downloadUrl}
          onDownload={handleDownload}
          onReset={reset}
          locale={locale}
        />
        <ErrorMessage tone="info" title={copy.afterConvertTitle} message={copy.formattingNotice} />
      </div>
    );
  }

  if (flow.status === "processing") {
    return <ProcessingState label={copy.converting} />;
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
        label={copy.uploadLabel}
        hint={copy.uploadHint}
        locale={locale}
      />

      {file && <ErrorMessage tone="info" title={copy.beforeConvertTitle} message={copy.formattingNotice} />}

      {flow.status === "error" && <ErrorMessage message={flow.message} />}

      <ToolActionBar
        actionLabel={copy.convertAction}
        onAction={handleConvert}
        disabled={!file}
        showReset={file !== null}
        onReset={reset}
        locale={locale}
      />
    </div>
  );
}

"use client";

import { CheckCircleIcon, DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export interface ResultDownloadProps {
  fileName: string;
  fileSizeLabel?: string;
  downloadUrl: string;
  onReset?: () => void;
  /** Overrides the default navigation-based download (window.location.href) — e.g. to fetch as a blob so a repeat click against a single-use link can be handled without leaving the page. */
  onDownload?: () => void;
}

export function ResultDownload({
  fileName,
  fileSizeLabel,
  downloadUrl,
  onReset,
  onDownload,
}: ResultDownloadProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950"
    >
      <CheckCircleIcon className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{fileName}</p>
        {fileSizeLabel && <p className="text-sm text-slate-600 dark:text-slate-400">{fileSizeLabel}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          leftIcon={<DownloadIcon className="h-4 w-4" />}
          onClick={
            onDownload ??
            (() => {
              window.location.href = downloadUrl;
            })
          }
        >
          Download
        </Button>
        {onReset && (
          <Button variant="secondary" onClick={onReset}>
            Process another file
          </Button>
        )}
      </div>
    </div>
  );
}

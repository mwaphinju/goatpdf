import { trackFileDownload } from "@/lib/analytics/ga";

export type DownloadResult = { ok: true } | { ok: false; message: string };

/**
 * Fetches a single-use download link as a blob and triggers a browser save,
 * rather than navigating to the URL directly — a plain navigation can't be
 * retried once the link is consumed. Shared by every tool's success state.
 * `toolName` is used only to label the file_download analytics event —
 * never the download URL or the generated filename.
 */
export async function downloadFile(downloadUrl: string, fileName: string, toolName: string): Promise<DownloadResult> {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        ok: false,
        message: data?.message ?? "This download link has expired. Please try again.",
      };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    trackFileDownload(toolName);
    return { ok: true };
  } catch {
    return { ok: false, message: "Network error while downloading. Please try again." };
  }
}

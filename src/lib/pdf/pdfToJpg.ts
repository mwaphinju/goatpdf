import { promises as fs } from "node:fs";
import JSZip from "jszip";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { resolveSelectedPages } from "@/lib/pdf/pageSelection";
import { renderPdfPagesToJpeg } from "@/lib/pdf/pdfRenderer";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export type ImageQuality = "low" | "medium" | "high";
export interface PdfToJpgOptions {
  quality: ImageQuality;
  pages: "all" | number[];
}

// jpegQuality is on a 0-100 scale (the underlying Skia encoder's convention),
// not the 0-1 scale used elsewhere (e.g. sharp) — verified empirically.
const QUALITY_PRESETS: Record<ImageQuality, { scale: number; jpegQuality: number }> = {
  low: { scale: 1, jpegQuality: 60 },
  medium: { scale: 1.5, jpegQuality: 75 },
  high: { scale: 2, jpegQuality: 92 },
};

function isPdfToJpgOptions(value: unknown): value is PdfToJpgOptions {
  if (typeof value !== "object" || value === null) return false;
  const { quality, pages } = value as { quality?: unknown; pages?: unknown };
  if (quality !== "low" && quality !== "medium" && quality !== "high") return false;
  if (pages === "all") return true;
  return Array.isArray(pages) && pages.every((page) => typeof page === "number");
}

export async function pdfToJpg(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isPdfToJpgOptions(context.options)) {
    throw new InvalidOptionsError("Choose an image quality before continuing.");
  }

  const file = context.files[0];
  // Validate with pdf-lib first — a battle-tested, consistent way to catch
  // corrupted/unreadable PDFs across every tool — before handing the file to
  // the separate pdfjs-dist rendering pipeline.
  const { pageCount } = await loadPdfOrThrow(file.path, file.safeName);

  const pageNumbers = resolveSelectedPages(
    context.options.pages,
    pageCount,
    "Select at least one page to convert.",
  );

  const preset = QUALITY_PRESETS[context.options.quality];
  const pdfBytes = await fs.readFile(file.path);

  let rendered;
  try {
    rendered = await renderPdfPagesToJpeg(pdfBytes, pageNumbers, preset.scale, preset.jpegQuality);
  } catch {
    throw new UnreadableFileError(file.safeName);
  }

  if (rendered.length === 1) {
    const outputPath = await writeWorkspaceFile(context.workspaceDir, ".jpg", rendered[0].jpegBuffer);
    const fileName = "page.jpg";
    return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
  }

  const zip = new JSZip();
  const numberWidth = String(pageCount).length;
  for (const { pageNumber, jpegBuffer } of rendered) {
    const paddedNumber = String(pageNumber).padStart(numberWidth, "0");
    zip.file(`page-${paddedNumber}.jpg`, jpegBuffer);
  }

  const zipBytes = await zip.generateAsync({ type: "nodebuffer" });
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".zip", zipBytes);
  const fileName = "pages.zip";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

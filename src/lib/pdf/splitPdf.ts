import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { InvalidOptionsError } from "@/lib/processing/errors";
import { parsePageRanges } from "@/lib/pdf/pageRanges";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export type SplitPdfOptions = { mode: "all-pages" } | { mode: "ranges"; ranges: string };

function isSplitPdfOptions(value: unknown): value is SplitPdfOptions {
  if (typeof value !== "object" || value === null || !("mode" in value)) return false;
  const { mode } = value as { mode: unknown };
  if (mode === "all-pages") return true;
  if (mode === "ranges") {
    return "ranges" in value && typeof (value as { ranges: unknown }).ranges === "string";
  }
  return false;
}

export async function splitPdf(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isSplitPdfOptions(context.options)) {
    throw new InvalidOptionsError("Choose how you'd like to split this PDF before continuing.");
  }

  const file = context.files[0];
  const { doc: sourceDoc, pageCount } = await loadPdfOrThrow(file.path, file.safeName);

  if (context.options.mode === "all-pages") {
    const zip = new JSZip();
    const pageNumberWidth = String(pageCount).length;

    for (let index = 0; index < pageCount; index++) {
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(sourceDoc, [index]);
      singlePageDoc.addPage(copiedPage);
      const pageBytes = await singlePageDoc.save();
      const pageNumber = String(index + 1).padStart(pageNumberWidth, "0");
      zip.file(`page-${pageNumber}.pdf`, pageBytes);
    }

    const zipBytes = await zip.generateAsync({ type: "nodebuffer" });
    const outputPath = await writeWorkspaceFile(context.workspaceDir, ".zip", zipBytes);
    const fileName = "split-pages.zip";
    return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
  }

  const parsed = parsePageRanges(context.options.ranges, pageCount);
  if (!parsed.ok) {
    throw new InvalidOptionsError(parsed.error);
  }

  const outputDoc = await PDFDocument.create();
  const pageIndices = parsed.pages.map((pageNumber) => pageNumber - 1);
  const copiedPages = await outputDoc.copyPages(sourceDoc, pageIndices);
  for (const page of copiedPages) {
    outputDoc.addPage(page);
  }

  const outputBytes = await outputDoc.save();
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(outputBytes));
  const fileName = "split.pdf";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

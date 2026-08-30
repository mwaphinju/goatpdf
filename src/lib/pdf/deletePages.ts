import { PDFDocument } from "pdf-lib";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { InvalidOptionsError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export type DeletePagesOptions = { pages: number[] };

function isDeletePagesOptions(value: unknown): value is DeletePagesOptions {
  if (typeof value !== "object" || value === null) return false;
  const { pages } = value as { pages?: unknown };
  return Array.isArray(pages) && pages.every((page) => typeof page === "number");
}

export async function deletePages(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isDeletePagesOptions(context.options) || context.options.pages.length === 0) {
    throw new InvalidOptionsError("Select at least one page to delete.");
  }

  const file = context.files[0];
  const { doc, pageCount } = await loadPdfOrThrow(file.path, file.safeName);

  const pagesToDelete = new Set(context.options.pages);
  for (const pageNumber of pagesToDelete) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new InvalidOptionsError(
        `Page ${pageNumber} doesn't exist — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`,
      );
    }
  }

  if (pagesToDelete.size >= pageCount) {
    throw new InvalidOptionsError("You can't delete every page — at least one page must remain.");
  }

  const keepIndices = Array.from({ length: pageCount }, (_, index) => index).filter(
    (index) => !pagesToDelete.has(index + 1),
  );

  const outputDoc = await PDFDocument.create();
  const copiedPages = await outputDoc.copyPages(doc, keepIndices);
  for (const page of copiedPages) {
    outputDoc.addPage(page);
  }

  const outputBytes = await outputDoc.save();
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(outputBytes));
  const fileName = "pages-removed.pdf";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

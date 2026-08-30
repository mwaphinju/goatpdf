import { promises as fs } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { TotalSizeTooLargeError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export const MAX_COMBINED_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB across all input files

/** Pure size-limit check, kept separate from disk I/O so it's cheap to unit test with fabricated sizes. */
export function assertCombinedSizeWithinLimit(
  sizes: number[],
  maxTotalBytes: number = MAX_COMBINED_SIZE_BYTES,
): void {
  const totalSize = sizes.reduce((sum, size) => sum + size, 0);
  if (totalSize > maxTotalBytes) {
    throw new TotalSizeTooLargeError(Math.round(maxTotalBytes / (1024 * 1024)));
  }
}

export async function mergePdf(context: ProcessingContext): Promise<ProcessingResult> {
  const sizes = await Promise.all(context.files.map((file) => fs.stat(file.path).then((s) => s.size)));
  assertCombinedSizeWithinLimit(sizes);

  const mergedDoc = await PDFDocument.create();

  for (const file of context.files) {
    const bytes = await fs.readFile(file.path);

    try {
      const sourceDoc = await PDFDocument.load(bytes);
      const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    } catch {
      throw new UnreadableFileError(file.safeName);
    }
  }

  const mergedBytes = await mergedDoc.save();
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(mergedBytes));

  const fileName = "merged.pdf";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

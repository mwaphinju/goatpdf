import { promises as fs } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { UnreadableFileError } from "@/lib/processing/errors";

/**
 * Safely loads a PDF from disk for processing. `getPageCount()` is
 * deliberately called inside the same try/catch as `load()` — pdf-lib can
 * parse a structurally broken PDF "successfully" and only throw once you
 * start walking its page tree, so anything that touches page data must stay
 * inside this same guard to reliably surface as UnreadableFileError.
 */
export async function loadPdfOrThrow(
  filePath: string,
  safeName: string,
): Promise<{ doc: PDFDocument; pageCount: number }> {
  const bytes = await fs.readFile(filePath);
  try {
    const doc = await PDFDocument.load(bytes);
    const pageCount = doc.getPageCount();
    return { doc, pageCount };
  } catch {
    throw new UnreadableFileError(safeName);
  }
}

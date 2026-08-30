import { InvalidOptionsError } from "@/lib/processing/errors";

/**
 * Resolves an "every page" or explicit-page-numbers selection into a
 * validated, deduplicated list of 1-indexed page numbers — shared by every
 * tool that lets the user choose "all pages" or specific ones (Rotate,
 * PDF to JPG). Kept separate from pageRanges.ts (which is pure and shared
 * with client-side validation) since this throws and is server-only.
 */
export function resolveSelectedPages(
  pages: "all" | number[],
  pageCount: number,
  emptySelectionMessage = "Select at least one page.",
): number[] {
  if (pages === "all") {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (pages.length === 0) {
    throw new InvalidOptionsError(emptySelectionMessage);
  }

  const uniquePages = Array.from(new Set(pages));
  for (const pageNumber of uniquePages) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new InvalidOptionsError(
        `Page ${pageNumber} doesn't exist — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`,
      );
    }
  }
  return uniquePages;
}

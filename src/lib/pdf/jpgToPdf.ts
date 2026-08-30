import { promises as fs } from "node:fs";
import { PDFDocument } from "pdf-lib";
import type { PDFImage } from "pdf-lib";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { InvalidOptionsError, TotalSizeTooLargeError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export const MAX_COMBINED_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB across all input images

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

export type PageSize = "a4" | "letter" | "fit";
export type Orientation = "portrait" | "landscape";
export type Margin = "none" | "small" | "normal";

export interface JpgToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: Margin;
}

const PAGE_SIZES_PT: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const MARGIN_PT: Record<Margin, number> = {
  none: 0,
  small: 18,
  normal: 36,
};

// Sanity cap for "fit" page size, so an unusually large source image can't
// produce a pathologically huge PDF page.
const MAX_FIT_DIMENSION_PT = 2000;

function isJpgToPdfOptions(value: unknown): value is JpgToPdfOptions {
  if (typeof value !== "object" || value === null) return false;
  const { pageSize, orientation, margin } = value as {
    pageSize?: unknown;
    orientation?: unknown;
    margin?: unknown;
  };
  if (pageSize !== "a4" && pageSize !== "letter" && pageSize !== "fit") return false;
  if (orientation !== "portrait" && orientation !== "landscape") return false;
  if (margin !== "none" && margin !== "small" && margin !== "normal") return false;
  return true;
}

function getPageDimensions(pageSize: PageSize, orientation: Orientation, image: PDFImage): [number, number] {
  if (pageSize === "fit") {
    const scale = Math.min(1, MAX_FIT_DIMENSION_PT / Math.max(image.width, image.height));
    return [image.width * scale, image.height * scale];
  }

  const [width, height] = PAGE_SIZES_PT[pageSize];
  return orientation === "landscape" ? [height, width] : [width, height];
}

export async function jpgToPdf(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isJpgToPdfOptions(context.options)) {
    throw new InvalidOptionsError("Choose a page size before continuing.");
  }

  const sizes = await Promise.all(context.files.map((file) => fs.stat(file.path).then((s) => s.size)));
  assertCombinedSizeWithinLimit(sizes);

  const { pageSize, orientation, margin } = context.options;
  const marginPt = MARGIN_PT[margin];
  const doc = await PDFDocument.create();

  for (const file of context.files) {
    const bytes = await fs.readFile(file.path);

    let image: PDFImage;
    try {
      image = file.kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    } catch {
      throw new UnreadableFileError(file.safeName);
    }

    const [pageWidth, pageHeight] = getPageDimensions(pageSize, orientation, image);
    const page = doc.addPage([pageWidth, pageHeight]);

    const contentWidth = Math.max(pageWidth - marginPt * 2, 1);
    const contentHeight = Math.max(pageHeight - marginPt * 2, 1);

    const imageAspect = image.width / image.height;
    const boxAspect = contentWidth / contentHeight;

    let drawWidth: number;
    let drawHeight: number;
    if (imageAspect > boxAspect) {
      drawWidth = contentWidth;
      drawHeight = contentWidth / imageAspect;
    } else {
      drawHeight = contentHeight;
      drawWidth = contentHeight * imageAspect;
    }

    page.drawImage(image, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const outputBytes = await doc.save();
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(outputBytes));
  const fileName = "images.pdf";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

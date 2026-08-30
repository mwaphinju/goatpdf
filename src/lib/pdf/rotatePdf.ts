import { degrees } from "pdf-lib";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { resolveSelectedPages } from "@/lib/pdf/pageSelection";
import { InvalidOptionsError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export type RotationAngle = 90 | 180 | 270;
export type RotatePdfOptions = { angle: RotationAngle; pages: "all" | number[] };

function isRotatePdfOptions(value: unknown): value is RotatePdfOptions {
  if (typeof value !== "object" || value === null) return false;
  const { angle, pages } = value as { angle?: unknown; pages?: unknown };
  if (angle !== 90 && angle !== 180 && angle !== 270) return false;
  if (pages === "all") return true;
  return Array.isArray(pages) && pages.every((page) => typeof page === "number");
}

export async function rotatePdf(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isRotatePdfOptions(context.options)) {
    throw new InvalidOptionsError("Choose a rotation angle (90°, 180°, or 270°) before continuing.");
  }

  const file = context.files[0];
  const { doc, pageCount } = await loadPdfOrThrow(file.path, file.safeName);

  const targetPages = resolveSelectedPages(
    context.options.pages,
    pageCount,
    "Select at least one page to rotate.",
  );
  const pages = doc.getPages();

  for (const pageNumber of targetPages) {
    const page = pages[pageNumber - 1];
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + context.options.angle) % 360));
  }

  const outputBytes = await doc.save();
  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(outputBytes));
  const fileName = "rotated.pdf";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

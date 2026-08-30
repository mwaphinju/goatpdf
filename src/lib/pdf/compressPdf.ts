import { promises as fs } from "node:fs";
import { PDFDocument, PDFName, PDFNumber, PDFRawStream } from "pdf-lib";
import sharp from "sharp";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { InvalidOptionsError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

export type CompressionPreset = "recommended" | "high-quality" | "maximum-compression";

export interface CompressPdfOptions {
  preset: CompressionPreset;
}

interface PresetConfig {
  jpegQuality: number;
  maxDimension: number;
}

const PRESETS: Record<CompressionPreset, PresetConfig> = {
  "high-quality": { jpegQuality: 82, maxDimension: 2400 },
  recommended: { jpegQuality: 65, maxDimension: 1600 },
  "maximum-compression": { jpegQuality: 40, maxDimension: 1000 },
};

function isCompressPdfOptions(value: unknown): value is CompressPdfOptions {
  if (typeof value !== "object" || value === null) return false;
  const { preset } = value as { preset?: unknown };
  return preset === "recommended" || preset === "high-quality" || preset === "maximum-compression";
}

/**
 * Re-encodes embedded JPEG (DCTDecode) images at a lower quality/resolution
 * in place, image by image, mutating the document's own object graph.
 *
 * Scope is deliberately conservative: only plain DeviceRGB/DeviceGray JPEGs
 * without a soft mask are touched. Anything else (raw bitmaps, CMYK, JPEG2000,
 * CCITT fax scans, indexed color, transparency) is left completely untouched
 * rather than risk producing a corrupted or wrong-looking PDF — a text-only
 * or already-optimized PDF may see little or no reduction, which is expected
 * and handled gracefully by the caller (falling back to the original bytes).
 */
async function recompressImages(doc: PDFDocument, preset: PresetConfig): Promise<void> {
  const SUBTYPE = PDFName.of("Subtype");
  const IMAGE = PDFName.of("Image");
  const FILTER = PDFName.of("Filter");
  const DCT_DECODE = PDFName.of("DCTDecode");
  const COLOR_SPACE = PDFName.of("ColorSpace");
  const DEVICE_RGB = PDFName.of("DeviceRGB");
  const DEVICE_GRAY = PDFName.of("DeviceGray");
  const SMASK = PDFName.of("SMask");
  const WIDTH = PDFName.of("Width");
  const HEIGHT = PDFName.of("Height");
  const BITS_PER_COMPONENT = PDFName.of("BitsPerComponent");

  const indirectObjects = doc.context.enumerateIndirectObjects();

  for (const [ref, obj] of indirectObjects) {
    if (!(obj instanceof PDFRawStream)) continue;

    const { dict } = obj;
    if (dict.get(SUBTYPE) !== IMAGE) continue;
    if (dict.get(FILTER) !== DCT_DECODE) continue;
    if (dict.has(SMASK)) continue;

    const colorSpace = dict.get(COLOR_SPACE);
    if (colorSpace !== DEVICE_RGB && colorSpace !== DEVICE_GRAY) continue;

    const originalBytes = obj.getContents();

    let recompressed: { data: Buffer; width: number; height: number } | null = null;
    try {
      const jpegBuffer = await sharp(originalBytes, { failOn: "none" })
        .resize({
          width: preset.maxDimension,
          height: preset.maxDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: preset.jpegQuality, mozjpeg: true })
        .toBuffer();

      const metadata = await sharp(jpegBuffer).metadata();
      if (metadata.width && metadata.height) {
        recompressed = { data: jpegBuffer, width: metadata.width, height: metadata.height };
      }
    } catch {
      // Some embedded "JPEGs" are non-conformant in ways sharp refuses to decode.
      // Leave this image untouched rather than fail the whole compression job.
      recompressed = null;
    }

    if (!recompressed || recompressed.data.length >= originalBytes.length) continue;

    dict.set(WIDTH, PDFNumber.of(recompressed.width));
    dict.set(HEIGHT, PDFNumber.of(recompressed.height));
    dict.set(BITS_PER_COMPONENT, PDFNumber.of(8));

    const newStream = PDFRawStream.of(dict, recompressed.data);
    doc.context.assign(ref, newStream);
  }
}

export async function compressPdf(context: ProcessingContext): Promise<ProcessingResult> {
  if (!isCompressPdfOptions(context.options)) {
    throw new InvalidOptionsError("Choose a compression level before continuing.");
  }

  const file = context.files[0];
  const originalBytes = await fs.readFile(file.path);
  const { doc } = await loadPdfOrThrow(file.path, file.safeName);

  const preset = PRESETS[context.options.preset];
  await recompressImages(doc, preset);

  const candidateBytes = await doc.save({ useObjectStreams: true });

  // Never hand back something larger than what was uploaded — if our
  // recompression attempt didn't help (e.g. a text-only or already
  // well-optimized PDF), fall back to the original bytes untouched.
  const finalBytes = candidateBytes.byteLength < originalBytes.byteLength ? candidateBytes : originalBytes;

  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".pdf", Buffer.from(finalBytes));
  const fileName = "compressed.pdf";

  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}

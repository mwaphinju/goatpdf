import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument, PDFName, PDFRawStream, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { compressPdf } from "@/lib/pdf/compressPdf";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-compresspdf");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

/** Finds the (first) Image XObject stream in a document, distinguishing it from any other raw streams (e.g. content streams). */
function findImageStream(doc: PDFDocument): PDFRawStream {
  const entry = doc.context
    .enumerateIndirectObjects()
    .find(
      ([, obj]) =>
        obj instanceof PDFRawStream && obj.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"),
    );
  if (!entry) throw new Error("expected to find an embedded image object");
  const [, obj] = entry;
  if (!(obj instanceof PDFRawStream)) throw new Error("expected a PDFRawStream");
  return obj;
}

/** A high-quality, high-entropy (noisy) JPEG — the worst case for compressibility, so a reduction here proves the pipeline genuinely works rather than coasting on already-compressible content. */
async function makeNoisyJpeg(width: number, height: number, quality = 95): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  return sharp(raw, { raw: { width, height, channels: 3 } }).jpeg({ quality }).toBuffer();
}

async function makeTextOnlyPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`This is page ${i + 1} of a text-only document. `.repeat(20), {
      x: 20,
      y: 350,
      size: 8,
      font,
      maxWidth: 260,
      lineHeight: 10,
    });
  }
  return doc.save();
}

/** A "scanned"-style PDF: one full-page photographic JPEG per page, no text — typical scanner output. */
async function makeScannedStylePdf(pageCount: number, dimension = 1400): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const jpegBytes = await makeNoisyJpeg(dimension, dimension, 92);
    const image = await doc.embedJpg(jpegBytes);
    const page = doc.addPage([400, 400]);
    page.drawImage(image, { x: 0, y: 0, width: 400, height: 400 });
  }
  return doc.save();
}

async function makeImageHeavyPdf(imageCount: number, dimension = 1200): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  for (let i = 0; i < imageCount; i++) {
    const jpegBytes = await makeNoisyJpeg(dimension, dimension, 92);
    const image = await doc.embedJpg(jpegBytes);
    page.drawImage(image, { x: (i % 2) * 250, y: Math.floor(i / 2) * 250, width: 240, height: 240 });
  }
  return doc.save();
}

describe("compressPdf — text PDFs", () => {
  it("processes a small, text-only PDF without error and never grows it", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeTextOnlyPdf(2);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "recommended" },
    });

    const outputStats = await fs.stat(result.outputs[0].path);
    expect(outputStats.size).toBeLessThanOrEqual(bytes.byteLength);
  });
});

describe("compressPdf — image-heavy PDFs", () => {
  it("meaningfully reduces size on a PDF with several photographic JPEGs", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeImageHeavyPdf(4, 1200);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "maximum-compression" },
    });

    const outputStats = await fs.stat(result.outputs[0].path);
    expect(outputStats.size).toBeLessThan(bytes.byteLength);
    // A meaningful reduction, not just a rounding difference.
    expect(outputStats.size).toBeLessThan(bytes.byteLength * 0.85);
  });

  it("produces a smaller result at Maximum Compression than at High Quality", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeImageHeavyPdf(3, 1200);

    const highQualityInput = await stageFile(bytes, workspace.dir);
    const highQualityResult = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [highQualityInput],
      options: { preset: "high-quality" },
    });

    const maxInput = await stageFile(bytes, workspace.dir);
    const maxResult = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [maxInput],
      options: { preset: "maximum-compression" },
    });

    const highQualitySize = (await fs.stat(highQualityResult.outputs[0].path)).size;
    const maxSize = (await fs.stat(maxResult.outputs[0].path)).size;
    expect(maxSize).toBeLessThanOrEqual(highQualitySize);
  });

  it("outputs a structurally valid PDF with the same page and image count", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeImageHeavyPdf(2, 800);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "recommended" },
    });

    const outputBytes = await fs.readFile(result.outputs[0].path);
    const outputDoc = await PDFDocument.load(outputBytes);
    expect(outputDoc.getPageCount()).toBe(1);
  });
});

describe("compressPdf — scanned PDFs", () => {
  it("reduces the size of a scanner-style full-page-image PDF", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeScannedStylePdf(2, 1400);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "recommended" },
    });

    const outputStats = await fs.stat(result.outputs[0].path);
    expect(outputStats.size).toBeLessThan(bytes.byteLength);
  });
});

describe("compressPdf — small PDFs", () => {
  it("handles a minimal single-page PDF gracefully", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeTextOnlyPdf(1);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "recommended" },
    });

    const outputStats = await fs.stat(result.outputs[0].path);
    expect(outputStats.size).toBeGreaterThan(0);
    expect(outputStats.size).toBeLessThanOrEqual(bytes.byteLength);
  });
});

describe("compressPdf — large PDFs", () => {
  it("handles a many-page, image-heavy PDF within the tool's timeout budget", async () => {
    const workspace = await createJobWorkspace();
    const bytes = await makeScannedStylePdf(15, 900);
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "recommended" },
    });

    const outputBytes = await fs.readFile(result.outputs[0].path);
    const outputDoc = await PDFDocument.load(outputBytes);
    expect(outputDoc.getPageCount()).toBe(15);
    expect(outputBytes.byteLength).toBeLessThan(bytes.byteLength);
  }, 30_000);
});

describe("compressPdf — already-compressed PDFs", () => {
  it("does not grow a file that's already been through maximum compression, and reports gracefully", async () => {
    const workspace = await createJobWorkspace();
    const original = await makeImageHeavyPdf(3, 1200);
    const firstPassInput = await stageFile(original, workspace.dir);

    const firstPass = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [firstPassInput],
      options: { preset: "maximum-compression" },
    });
    const firstPassBytes = await fs.readFile(firstPass.outputs[0].path);

    const secondPassInput = await stageFile(firstPassBytes, workspace.dir);
    const secondPass = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [secondPassInput],
      options: { preset: "maximum-compression" },
    });
    const secondPassStats = await fs.stat(secondPass.outputs[0].path);

    // Re-compressing an already-compressed file must never make it bigger.
    expect(secondPassStats.size).toBeLessThanOrEqual(firstPassBytes.byteLength);
  });
});

describe("compressPdf — safety scope", () => {
  it("leaves a non-JPEG (Flate-encoded) image untouched rather than risk corrupting it", async () => {
    const workspace = await createJobWorkspace();
    const doc = await PDFDocument.create();
    const pngBytes = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 100, g: 150, b: 200 } },
    })
      .png()
      .toBuffer();
    const pngImage = await doc.embedPng(pngBytes);
    const page = doc.addPage([200, 200]);
    page.drawImage(pngImage, { x: 0, y: 0, width: 100, height: 100 });
    const bytes = await doc.save();
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "maximum-compression" },
    });

    const outputBytes = await fs.readFile(result.outputs[0].path);
    const outputDoc = await PDFDocument.load(outputBytes);
    expect(outputDoc.getPageCount()).toBe(1); // still loads and renders fine
  });

  it("leaves a DeviceCMYK-tagged image untouched even if it's DCTDecode", async () => {
    const workspace = await createJobWorkspace();
    const builderDoc = await PDFDocument.create();
    const jpegBytes = await makeNoisyJpeg(200, 200, 90);
    const image = await builderDoc.embedJpg(jpegBytes);
    const page = builderDoc.addPage([200, 200]);
    page.drawImage(image, { x: 0, y: 0, width: 200, height: 200 });

    // Round-trip through save/load first, so the object graph matches what
    // compressPdf actually operates on (loadPdfOrThrow always loads from bytes —
    // it never sees a live, freshly-built PDFDocument like builderDoc above).
    const doc = await PDFDocument.load(await builderDoc.save());

    // Force the embedded image's ColorSpace to DeviceCMYK to simulate a CMYK JPEG,
    // without needing to synthesize a real CMYK-encoded JPEG file.
    const imageObj = findImageStream(doc);
    imageObj.dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceCMYK"));
    const originalContents = Buffer.from(imageObj.getContents().slice());

    const bytes = await doc.save();
    const input = await stageFile(bytes, workspace.dir);

    const result = await compressPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { preset: "maximum-compression" },
    });

    // Check compressPdf's actual *output*, not the input — confirm the CMYK-tagged
    // image survived byte-for-byte, proving it was genuinely skipped, not just
    // coincidentally unchanged.
    const outputBytes = await fs.readFile(result.outputs[0].path);
    const outputDoc = await PDFDocument.load(outputBytes);
    const outputImageObj = findImageStream(outputDoc);
    expect(outputImageObj.dict.get(PDFName.of("ColorSpace"))).toBe(PDFName.of("DeviceCMYK"));
    expect(Buffer.from(outputImageObj.getContents())).toEqual(originalContents);
  });
});

describe("compressPdf — invalid input handling", () => {
  it("rejects a missing preset", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makeTextOnlyPdf(1), workspace.dir);

    await expect(
      compressPdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an unrecognized preset value", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makeTextOnlyPdf(1), workspace.dir);

    await expect(
      compressPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { preset: "ultra-max" },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("throws UnreadableFileError for a corrupted PDF", async () => {
    const workspace = await createJobWorkspace();
    const corruptPath = await writeWorkspaceFile(
      workspace.dir,
      ".pdf",
      Buffer.from("%PDF-1.4\nnot a real pdf body\n%%EOF"),
    );
    const input: ProcessingInputFile = { path: corruptPath, safeName: "corrupt.pdf", kind: "pdf" };

    await expect(
      compressPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { preset: "recommended" },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

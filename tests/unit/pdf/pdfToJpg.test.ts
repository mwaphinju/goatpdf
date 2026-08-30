import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { pdfToJpg } from "@/lib/pdf/pdfToJpg";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-pdftojpg");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
}, 20_000);

async function makePdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([120, 150]);
    page.drawText(`Page ${i + 1}`, { x: 10, y: 100, size: 12, font });
  }
  return doc.save();
}

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

describe("pdfToJpg — converting all pages", () => {
  it("renders every page into a ZIP of JPEGs when there's more than one page", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    const result = await pdfToJpg({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { quality: "low", pages: "all" },
    });

    expect(result.outputs[0].fileName).toBe("pages.zip");
    expect(result.outputs[0].contentType).toBe("application/zip");

    const zip = await JSZip.loadAsync(await fs.readFile(result.outputs[0].path));
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["page-1.jpg", "page-2.jpg", "page-3.jpg"]);

    for (const name of names) {
      const bytes = await zip.files[name].async("nodebuffer");
      expect(isJpeg(bytes)).toBe(true);
    }
  }, 20_000);

  it("renders directly to a single JPEG when only one page results", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(1), workspace.dir);

    const result = await pdfToJpg({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { quality: "medium", pages: "all" },
    });

    expect(result.outputs[0].fileName).toBe("page.jpg");
    expect(result.outputs[0].contentType).toBe("image/jpeg");

    const bytes = await fs.readFile(result.outputs[0].path);
    expect(isJpeg(bytes)).toBe(true);
  }, 20_000);
});

describe("pdfToJpg — converting selected pages", () => {
  it("renders only the selected pages", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(4), workspace.dir);

    const result = await pdfToJpg({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { quality: "low", pages: [2, 4] },
    });

    const zip = await JSZip.loadAsync(await fs.readFile(result.outputs[0].path));
    expect(Object.keys(zip.files).sort()).toEqual(["page-2.jpg", "page-4.jpg"]);
  }, 20_000);
});

describe("pdfToJpg — quality presets", () => {
  it("produces a higher-resolution image at High than at Low", async () => {
    const workspace = await createJobWorkspace();

    const lowInput = await stageFile(await makePdfBytes(1), workspace.dir);
    const lowResult = await pdfToJpg({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [lowInput],
      options: { quality: "low", pages: "all" },
    });
    const lowMeta = await sharp(await fs.readFile(lowResult.outputs[0].path)).metadata();

    const highInput = await stageFile(await makePdfBytes(1), workspace.dir);
    const highResult = await pdfToJpg({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [highInput],
      options: { quality: "high", pages: "all" },
    });
    const highMeta = await sharp(await fs.readFile(highResult.outputs[0].path)).metadata();

    expect(highMeta.width ?? 0).toBeGreaterThan(lowMeta.width ?? 0);
  }, 20_000);
});

describe("pdfToJpg — invalid input handling", () => {
  it("rejects a missing/malformed options shape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(1), workspace.dir);

    await expect(
      pdfToJpg({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an empty page selection", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      pdfToJpg({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { quality: "low", pages: [] },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an out-of-range page number", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      pdfToJpg({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { quality: "low", pages: [9] },
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
      pdfToJpg({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { quality: "low", pages: "all" },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

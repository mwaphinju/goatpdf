import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument, degrees } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import { rotatePdf } from "@/lib/pdf/rotatePdf";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-rotatepdf");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function makePdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([200, 300]);
  return doc.save();
}

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

describe("rotatePdf — rotating all pages", () => {
  it("rotates every page by the given angle", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    const result = await rotatePdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { angle: 90, pages: "all" },
    });

    expect(result.outputs[0].fileName).toBe("rotated.pdf");
    expect(result.outputs[0].contentType).toBe("application/pdf");

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    const rotations = outputDoc.getPages().map((p) => p.getRotation().angle);
    expect(rotations).toEqual([90, 90, 90]);
  });

  it.each([90, 180, 270] as const)("supports a %d° rotation", async (angle) => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(1), workspace.dir);

    const result = await rotatePdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { angle, pages: "all" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPages()[0].getRotation().angle).toBe(angle);
  });

  it("adds to any existing rotation rather than overwriting it", async () => {
    const workspace = await createJobWorkspace();
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    page.setRotation(degrees(180));
    const bytes = await doc.save();
    const input = await stageFile(bytes, workspace.dir);

    const result = await rotatePdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { angle: 90, pages: "all" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPages()[0].getRotation().angle).toBe(270); // 180 + 90
  });
});

describe("rotatePdf — rotating selected pages", () => {
  it("rotates only the selected pages, leaving the rest untouched", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(4), workspace.dir);

    const result = await rotatePdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { angle: 90, pages: [2, 4] },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    const rotations = outputDoc.getPages().map((p) => p.getRotation().angle);
    expect(rotations).toEqual([0, 90, 0, 90]);
  });
});

describe("rotatePdf — invalid input handling", () => {
  it("rejects an empty page selection", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      rotatePdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { angle: 90, pages: [] },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an out-of-range page number", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      rotatePdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { angle: 90, pages: [5] },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects a missing/malformed options shape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      rotatePdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an unsupported angle", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      rotatePdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { angle: 45, pages: "all" },
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
      rotatePdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { angle: 90, pages: "all" },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

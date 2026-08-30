import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { jpgToPdf } from "@/lib/pdf/jpgToPdf";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-jpgtopdf");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function makeJpegBytes(width: number, height: number, color = { r: 200, g: 80, b: 80 }): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toBuffer();
}

async function makePngBytes(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 80, g: 80, b: 200 } } })
    .png()
    .toBuffer();
}

async function stageImage(
  bytes: Buffer,
  extension: string,
  kind: ProcessingInputFile["kind"],
  workspaceDir: string,
): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, extension, bytes);
  return { path: filePath, safeName: `input${extension}`, kind };
}

describe("jpgToPdf — basic conversion", () => {
  it("creates one page per image, in the order given", async () => {
    const workspace = await createJobWorkspace();
    const first = await stageImage(await makeJpegBytes(300, 200), ".jpg", "jpeg", workspace.dir);
    const second = await stageImage(await makeJpegBytes(200, 300), ".jpg", "jpeg", workspace.dir);

    const result = await jpgToPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [first, second],
      options: { pageSize: "a4", orientation: "portrait", margin: "normal" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPageCount()).toBe(2);
    expect(result.outputs[0].fileName).toBe("images.pdf");
    expect(result.outputs[0].contentType).toBe("application/pdf");
  });

  it("supports PNG input alongside JPEG", async () => {
    const workspace = await createJobWorkspace();
    const jpeg = await stageImage(await makeJpegBytes(200, 200), ".jpg", "jpeg", workspace.dir);
    const png = await stageImage(await makePngBytes(200, 200), ".png", "png", workspace.dir);

    const result = await jpgToPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [jpeg, png],
      options: { pageSize: "a4", orientation: "portrait", margin: "none" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPageCount()).toBe(2);
  });
});

describe("jpgToPdf — page size and orientation", () => {
  it("uses standard A4 dimensions in portrait", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageImage(await makeJpegBytes(100, 100), ".jpg", "jpeg", workspace.dir);

    const result = await jpgToPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { pageSize: "a4", orientation: "portrait", margin: "none" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    const page = outputDoc.getPage(0);
    expect(page.getWidth()).toBeCloseTo(595.28, 0);
    expect(page.getHeight()).toBeCloseTo(841.89, 0);
  });

  it("swaps width and height for landscape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageImage(await makeJpegBytes(100, 100), ".jpg", "jpeg", workspace.dir);

    const result = await jpgToPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { pageSize: "letter", orientation: "landscape", margin: "none" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    const page = outputDoc.getPage(0);
    expect(page.getWidth()).toBeCloseTo(792, 0);
    expect(page.getHeight()).toBeCloseTo(612, 0);
  });

  it("matches the image's own aspect ratio when pageSize is 'fit'", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageImage(await makeJpegBytes(400, 100), ".jpg", "jpeg", workspace.dir);

    const result = await jpgToPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { pageSize: "fit", orientation: "portrait", margin: "none" },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    const page = outputDoc.getPage(0);
    expect(page.getWidth() / page.getHeight()).toBeCloseTo(4, 1); // 400x100 -> 4:1
  });
});

describe("jpgToPdf — invalid input handling", () => {
  it("rejects a missing/malformed options shape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageImage(await makeJpegBytes(100, 100), ".jpg", "jpeg", workspace.dir);

    await expect(
      jpgToPdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("throws UnreadableFileError for a file with valid JPEG magic bytes but a corrupted body", async () => {
    const workspace = await createJobWorkspace();
    const corruptBytes = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from("this is not a real jpeg body, just garbage after the magic bytes"),
    ]);
    const corrupt: ProcessingInputFile = {
      path: await writeWorkspaceFile(workspace.dir, ".jpg", corruptBytes),
      safeName: "corrupt.jpg",
      kind: "jpeg",
    };

    await expect(
      jpgToPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [corrupt],
        options: { pageSize: "a4", orientation: "portrait", margin: "normal" },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

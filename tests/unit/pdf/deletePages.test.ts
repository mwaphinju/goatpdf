import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { deletePages } from "@/lib/pdf/deletePages";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-deletepages");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function makePdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 300]);
    page.setWidth(200 + i); // distinct marker per page, for verifying which pages survive
  }
  return doc.save();
}

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

describe("deletePages — deleting selected pages", () => {
  it("removes exactly the selected pages and keeps the rest in order", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(5), workspace.dir);

    const result = await deletePages({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { pages: [2, 4] },
    });

    expect(result.outputs[0].fileName).toBe("pages-removed.pdf");
    expect(result.outputs[0].contentType).toBe("application/pdf");

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPageCount()).toBe(3);
    const widths = outputDoc.getPages().map((p) => p.getWidth());
    expect(widths).toEqual([200, 202, 204]); // original pages 1, 3, 5 survive
  });

  it("dedupes repeated page numbers", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    const result = await deletePages({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { pages: [1, 1, 1] },
    });

    const outputDoc = await PDFDocument.load(await fs.readFile(result.outputs[0].path));
    expect(outputDoc.getPageCount()).toBe(2);
  });
});

describe("deletePages — invalid selections", () => {
  it("rejects an empty selection", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      deletePages({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { pages: [] },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects an out-of-range page number", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      deletePages({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { pages: [7] },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects deleting every page in the document", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      deletePages({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { pages: [1, 2, 3] },
      }),
    ).rejects.toThrow(/at least one page must remain/i);
  });

  it("rejects a missing/malformed options shape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      deletePages({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
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
      deletePages({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { pages: [1] },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

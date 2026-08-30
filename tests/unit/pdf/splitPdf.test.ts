import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { InvalidOptionsError, UnreadableFileError } from "@/lib/processing/errors";
import { splitPdf } from "@/lib/pdf/splitPdf";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-splitpdf");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function makePdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 300]);
    // Give each page a distinct visual marker (width) so page order/identity can be verified after splitting.
    page.setWidth(200 + i);
  }
  return doc.save();
}

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

describe("splitPdf — split into individual pages", () => {
  it("produces a zip containing one single-page PDF per page", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    const result = await splitPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { mode: "all-pages" },
    });

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].fileName).toBe("split-pages.zip");
    expect(result.outputs[0].contentType).toBe("application/zip");

    const zipBytes = await fs.readFile(result.outputs[0].path);
    const zip = await JSZip.loadAsync(zipBytes);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["page-1.pdf", "page-2.pdf", "page-3.pdf"]);

    const page2Bytes = await zip.files["page-2.pdf"].async("nodebuffer");
    const page2Doc = await PDFDocument.load(page2Bytes);
    expect(page2Doc.getPageCount()).toBe(1);
    expect(page2Doc.getPages()[0].getWidth()).toBe(201); // second page (index 1) had width 200+1
  });
});

describe("splitPdf — extract page ranges", () => {
  it("extracts exactly the requested pages, in the requested order", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(5), workspace.dir);

    const result = await splitPdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [input],
      options: { mode: "ranges", ranges: "1-2, 5" },
    });

    expect(result.outputs[0].fileName).toBe("split.pdf");
    expect(result.outputs[0].contentType).toBe("application/pdf");

    const outputBytes = await fs.readFile(result.outputs[0].path);
    const outputDoc = await PDFDocument.load(outputBytes);
    expect(outputDoc.getPageCount()).toBe(3);
    const widths = outputDoc.getPages().map((p) => p.getWidth());
    expect(widths).toEqual([200, 201, 204]); // pages 1, 2, 5 (0-indexed widths 200,201,204)
  });

  it("rejects an out-of-range page with InvalidOptionsError", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      splitPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { mode: "ranges", ranges: "1-3, 10" },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("rejects empty ranges input", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(3), workspace.dir);

    await expect(
      splitPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { mode: "ranges", ranges: "" },
      }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });
});

describe("splitPdf — invalid input handling", () => {
  it("throws InvalidOptionsError when no options are given", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      splitPdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(InvalidOptionsError);
  });

  it("throws InvalidOptionsError for a malformed options shape", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makePdfBytes(2), workspace.dir);

    await expect(
      splitPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { mode: "nonsense" },
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
      splitPdf({
        jobId: workspace.id,
        workspaceDir: workspace.dir,
        files: [input],
        options: { mode: "all-pages" },
      }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });
});

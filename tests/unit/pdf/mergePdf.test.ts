import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { assertCombinedSizeWithinLimit, MAX_COMBINED_SIZE_BYTES, mergePdf } from "@/lib/pdf/mergePdf";
import { TotalSizeTooLargeError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-mergepdf");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

async function makePdfBytes(pageCount: number, width = 200): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([width, 300]);
  }
  return doc.save();
}

async function stageFile(bytes: Uint8Array, safeName: string, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName, kind: "pdf" };
}

describe("mergePdf", () => {
  it("merges pages from multiple PDFs, in input order, into one document", async () => {
    const workspace = await createJobWorkspace();
    const docA = await stageFile(await makePdfBytes(2, 200), "a.pdf", workspace.dir);
    const docB = await stageFile(await makePdfBytes(3, 300), "b.pdf", workspace.dir);

    const result = await mergePdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [docA, docB] });

    expect(result.outputs).toHaveLength(1);
    const mergedBytes = await fs.readFile(result.outputs[0].path);
    const mergedDoc = await PDFDocument.load(mergedBytes);

    expect(mergedDoc.getPageCount()).toBe(5);
    const widths = mergedDoc.getPages().map((page) => page.getWidth());
    expect(widths).toEqual([200, 200, 300, 300, 300]);
  });

  it("respects reordered input — later files appear later in the merged output", async () => {
    const workspace = await createJobWorkspace();
    const docA = await stageFile(await makePdfBytes(1, 111), "a.pdf", workspace.dir);
    const docB = await stageFile(await makePdfBytes(1, 222), "b.pdf", workspace.dir);

    const result = await mergePdf({
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      files: [docB, docA], // reordered: B before A
    });

    const mergedBytes = await fs.readFile(result.outputs[0].path);
    const mergedDoc = await PDFDocument.load(mergedBytes);
    const widths = mergedDoc.getPages().map((page) => page.getWidth());
    expect(widths).toEqual([222, 111]);
  });

  it("throws UnreadableFileError for a corrupted PDF (valid magic bytes, invalid structure)", async () => {
    const workspace = await createJobWorkspace();
    const goodDoc = await stageFile(await makePdfBytes(1), "good.pdf", workspace.dir);
    const corruptBytes = Buffer.from("%PDF-1.4\nthis is not a real pdf body at all\n%%EOF");
    const corruptDoc = await stageFile(corruptBytes, "corrupt.pdf", workspace.dir);

    await expect(
      mergePdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [goodDoc, corruptDoc] }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });

  it("names the corrupted file in the error without leaking file contents", async () => {
    const workspace = await createJobWorkspace();
    const corruptBytes = Buffer.from("%PDF-1.4\nnot a real pdf\n%%EOF");
    const corruptDoc = await stageFile(corruptBytes, "My Report.pdf", workspace.dir);

    await expect(
      mergePdf({ jobId: workspace.id, workspaceDir: workspace.dir, files: [corruptDoc] }),
    ).rejects.toThrow(/My Report\.pdf/);
  });
});

describe("assertCombinedSizeWithinLimit", () => {
  it("allows a combined size at or under the limit", () => {
    expect(() => assertCombinedSizeWithinLimit([10, 20, 30], 60)).not.toThrow();
    expect(() => assertCombinedSizeWithinLimit([100], 100)).not.toThrow();
  });

  it("throws TotalSizeTooLargeError when the combined size exceeds the limit", () => {
    expect(() => assertCombinedSizeWithinLimit([60, 60], 100)).toThrow(TotalSizeTooLargeError);
  });

  it("uses the real 200 MB default when no override is given", () => {
    expect(() => assertCombinedSizeWithinLimit([MAX_COMBINED_SIZE_BYTES + 1])).toThrow(
      TotalSizeTooLargeError,
    );
    expect(() => assertCombinedSizeWithinLimit([MAX_COMBINED_SIZE_BYTES])).not.toThrow();
  });
});

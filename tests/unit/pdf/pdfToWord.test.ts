import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { createJobWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { pdfToWord } from "@/lib/pdf/pdfToWord";
import { ConversionFailedError, UnreadableFileError } from "@/lib/processing/errors";
import type { ProcessingInputFile } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-pdftoword");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
}, 30_000);

async function stageFile(bytes: Uint8Array, workspaceDir: string): Promise<ProcessingInputFile> {
  const filePath = await writeWorkspaceFile(workspaceDir, ".pdf", Buffer.from(bytes));
  return { path: filePath, safeName: "input.pdf", kind: "pdf" };
}

/** Extracts the plain text pdf.js would see from a docx's word/document.xml, stripped of XML tags. */
async function extractDocxText(docxBytes: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(docxBytes);
  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) throw new Error("docx is missing word/document.xml — not a valid docx");
  const xml = await documentXmlFile.async("string");
  return xml.replace(/<[^>]+>/g, " ");
}

async function makeSimpleTextPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 500]);
  page.drawText("This is a simple paragraph of normal body text for conversion testing.", {
    x: 40,
    y: 400,
    size: 12,
    font,
    maxWidth: 320,
  });
  return doc.save();
}

/** A PDF exercising every category the phase asks to test: normal text, multiple pages, headings, a table, an embedded image, and several different fonts. */
async function makeComprehensivePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const courier = await doc.embedFont(StandardFonts.Courier);

  // Page 1: heading + normal body text.
  const page1 = doc.addPage([500, 650]);
  page1.drawText("GoatPdfHeadingMarkerAlpha", { x: 40, y: 590, size: 24, font: helveticaBold });
  page1.drawText(
    "This paragraph contains ordinary body text used to verify that normal text content survives PDF to Word conversion.",
    { x: 40, y: 540, size: 12, font: helvetica, maxWidth: 420, lineHeight: 16 },
  );

  // Page 2: a simple table (grid lines + cell text) and an embedded image.
  const page2 = doc.addPage([500, 650]);
  page2.drawText("GoatPdfTableMarkerBeta", { x: 40, y: 600, size: 16, font: helveticaBold });
  const tableTop = 570;
  const rowHeight = 24;
  const colWidths = [80, 80, 80];
  const tableLeft = 40;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  for (let row = 0; row <= 3; row++) {
    const y = tableTop - row * rowHeight;
    page2.drawLine({ start: { x: tableLeft, y }, end: { x: tableLeft + tableWidth, y }, thickness: 1, color: rgb(0, 0, 0) });
  }
  let x = tableLeft;
  for (const width of [0, ...colWidths]) {
    x += width;
    page2.drawLine({
      start: { x, y: tableTop },
      end: { x, y: tableTop - 3 * rowHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }
  const cellLabels = ["CellR1C1", "CellR1C2", "CellR1C3", "CellR2C1", "CellR2C2", "CellR2C3"];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const label = cellLabels[row * 3 + col];
      page2.drawText(label, {
        x: tableLeft + col * 80 + 6,
        y: tableTop - row * rowHeight - 16,
        size: 9,
        font: helvetica,
      });
    }
  }

  const imageBuffer = await sharp({
    create: { width: 120, height: 120, channels: 3, background: { r: 220, g: 90, b: 90 } },
  })
    .jpeg()
    .toBuffer();
  const embeddedImage = await doc.embedJpg(imageBuffer);
  page2.drawImage(embeddedImage, { x: 300, y: 460, width: 120, height: 120 });

  // Page 3: several different standard fonts on one page.
  const page3 = doc.addPage([500, 650]);
  page3.drawText("GoatPdfFontMarkerGamma", { x: 40, y: 600, size: 16, font: helveticaBold });
  page3.drawText("Text rendered in Helvetica.", { x: 40, y: 560, size: 12, font: helvetica });
  page3.drawText("Text rendered in Times Roman.", { x: 40, y: 530, size: 12, font: timesRoman });
  page3.drawText("Text rendered in Courier.", { x: 40, y: 500, size: 12, font: courier });

  return doc.save();
}

describe("pdfToWord — conversion", () => {
  it("converts a simple single-page text PDF into a valid, non-empty docx", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makeSimpleTextPdf(), workspace.dir);

    const result = await pdfToWord({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] });

    expect(result.outputs[0].fileName).toBe("converted.docx");
    expect(result.outputs[0].contentType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const stats = await fs.stat(result.outputs[0].path);
    expect(stats.size).toBeGreaterThan(0);

    const docxBytes = await fs.readFile(result.outputs[0].path);
    const zip = await JSZip.loadAsync(docxBytes);
    expect(zip.file("word/document.xml")).not.toBeNull();

    const text = await extractDocxText(docxBytes);
    expect(text).toContain("simple paragraph of normal body text");
  }, 60_000);

  it("preserves text across multiple pages, headings, table cell text, and different fonts; embeds the image", async () => {
    const workspace = await createJobWorkspace();
    const input = await stageFile(await makeComprehensivePdf(), workspace.dir);

    const result = await pdfToWord({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] });
    const docxBytes = await fs.readFile(result.outputs[0].path);

    const zip = await JSZip.loadAsync(docxBytes);
    const text = await extractDocxText(docxBytes);

    // Page 1 — heading + normal text.
    expect(text).toContain("GoatPdfHeadingMarkerAlpha");
    expect(text).toContain("ordinary body text");

    // Page 2 — table marker and at least some cell text.
    expect(text).toContain("GoatPdfTableMarkerBeta");
    expect(text).toContain("CellR1C1");

    // Page 3 — multiple different fonts' text content.
    expect(text).toContain("GoatPdfFontMarkerGamma");
    expect(text).toContain("Helvetica");
    expect(text).toContain("Times Roman");
    expect(text).toContain("Courier");

    // The embedded image should have come through as media inside the docx.
    const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith("word/media/"));
    expect(mediaFiles.length).toBeGreaterThan(0);
  }, 60_000);
});

describe("pdfToWord — invalid input handling", () => {
  it("throws UnreadableFileError for a corrupted PDF, without ever invoking LibreOffice", async () => {
    const workspace = await createJobWorkspace();
    const corruptPath = await writeWorkspaceFile(
      workspace.dir,
      ".pdf",
      Buffer.from("%PDF-1.4\nnot a real pdf body\n%%EOF"),
    );
    const input: ProcessingInputFile = { path: corruptPath, safeName: "corrupt.pdf", kind: "pdf" };

    await expect(
      pdfToWord({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
    ).rejects.toBeInstanceOf(UnreadableFileError);
  });

  describe("when the LibreOffice binary can't be found", () => {
    const originalSofficePath = process.env.SOFFICE_PATH;

    beforeEach(() => {
      process.env.SOFFICE_PATH = path.join(os.tmpdir(), "definitely-not-a-real-soffice-binary");
    });

    afterEach(() => {
      if (originalSofficePath === undefined) delete process.env.SOFFICE_PATH;
      else process.env.SOFFICE_PATH = originalSofficePath;
    });

    it("throws ConversionFailedError rather than an unhandled error", async () => {
      const workspace = await createJobWorkspace();
      const input = await stageFile(await makeSimpleTextPdf(), workspace.dir);

      await expect(
        pdfToWord({ jobId: workspace.id, workspaceDir: workspace.dir, files: [input] }),
      ).rejects.toBeInstanceOf(ConversionFailedError);
    });
  });
});

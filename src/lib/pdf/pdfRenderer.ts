import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
// The legacy Node build is the only one meant to run outside a browser/worker context.
// pdfjs-dist itself uses @napi-rs/canvas internally for Node (for any scratch canvases
// it needs during rendering), which is why that package — not the unrelated `canvas`
// package — is the one installed here.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// pdfjs-dist ships its standard-font and CJK cmap data as plain files rather
// than bundling them into pdf.mjs; without pointing it at them explicitly,
// PDFs that reference the 14 standard fonts (very common) render with
// incorrect/missing glyphs. Paths must be forward-slashed with a trailing
// slash — pdfjs's Node fetcher just does a plain fs.readFile(url + filename).
const PDFJS_DIST_DIR = path.join(process.cwd(), "node_modules", "pdfjs-dist");
const STANDARD_FONT_DATA_URL = `${path.join(PDFJS_DIST_DIR, "standard_fonts").replace(/\\/g, "/")}/`;
const CMAP_URL = `${path.join(PDFJS_DIST_DIR, "cmaps").replace(/\\/g, "/")}/`;

export interface RenderedPage {
  pageNumber: number;
  jpegBuffer: Buffer;
}

/**
 * Rasterizes specific pages of a PDF to JPEG buffers. `disableAutoFetch`/
 * `disableStream` are deliberate: this processes untrusted, user-uploaded
 * PDFs, so no network activity is attempted (older pdfjs-dist versions also
 * needed an `isEvalSupported: false` option to disable an eval-based code
 * path implicated in a real advisory — that option no longer exists in this
 * version because the eval-based path itself was removed upstream).
 */
export async function renderPdfPagesToJpeg(
  pdfBytes: Uint8Array,
  pageNumbers: number[],
  scale: number,
  jpegQuality: number,
): Promise<RenderedPage[]> {
  // pdf.js rejects a Node Buffer outright, even though Buffer is technically
  // a Uint8Array subclass — fs.readFile() returns a Buffer, so this
  // normalizes it to a plain Uint8Array view over the same bytes (no copy).
  const data =
    pdfBytes.constructor === Uint8Array
      ? pdfBytes
      : new Uint8Array(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength);

  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    disableAutoFetch: true,
    disableStream: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  });

  const results: RenderedPage[] = [];

  try {
    const pdf = await loadingTask.promise;

    for (const pageNumber of pageNumbers) {
      const page = await pdf.getPage(pageNumber);
      try {
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));

        // @napi-rs/canvas's Canvas/context are structurally close to, but not a perfect
        // match for, the DOM lib types pdf.js's render() is typed against — a well-known
        // interop gap (pdfjs-dist's own bundled Node canvas factory uses this exact
        // package internally), safe to bridge with a cast. The actual render call is
        // exercised end-to-end by tests/unit/pdf/pdfToJpg.test.ts.
        const renderTask = page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        });
        await renderTask.promise;

        const jpegBuffer = canvas.toBuffer("image/jpeg", jpegQuality);
        results.push({ pageNumber, jpegBuffer });
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return results;
}

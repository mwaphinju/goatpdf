import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, sanitizeFileName, validateFile } from "@/lib/files/validate";

const PDF_MAGIC_BYTES = Buffer.from("%PDF-1.4\n%%EOF");
const JPEG_MAGIC_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const TEXT_BYTES = Buffer.from("just plain text, not a real document");

function pdfFile(overrides: Partial<Parameters<typeof validateFile>[0]> = {}) {
  return {
    fileName: "report.pdf",
    mimeType: "application/pdf",
    size: PDF_MAGIC_BYTES.length,
    buffer: PDF_MAGIC_BYTES,
    ...overrides,
  };
}

describe("validateFile — valid files", () => {
  it("accepts a well-formed PDF", () => {
    const result = validateFile(pdfFile(), ["pdf"]);
    expect(result).toEqual({ ok: true, kind: "pdf", safeName: "report.pdf" });
  });

  it("accepts a well-formed JPEG", () => {
    const result = validateFile(
      {
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        size: JPEG_MAGIC_BYTES.length,
        buffer: JPEG_MAGIC_BYTES,
      },
      ["jpeg"],
    );
    expect(result).toEqual({ ok: true, kind: "jpeg", safeName: "photo.jpg" });
  });
});

describe("validateFile — invalid files", () => {
  it("rejects a file whose extension doesn't match any accepted kind", () => {
    const result = validateFile(pdfFile({ fileName: "report.exe" }), ["pdf"]);
    expect(result).toEqual({ ok: false, code: "UNSUPPORTED_EXTENSION", message: expect.any(String) });
  });

  it("rejects a file whose reported MIME type isn't accepted", () => {
    const result = validateFile(pdfFile({ mimeType: "application/octet-stream" }), ["pdf"]);
    expect(result).toEqual({ ok: false, code: "UNSUPPORTED_MIME_TYPE", message: expect.any(String) });
  });

  it("rejects a file whose magic bytes don't match a .pdf extension and application/pdf MIME type (spoofed upload)", () => {
    const result = validateFile(
      pdfFile({ buffer: TEXT_BYTES, size: TEXT_BYTES.length }),
      ["pdf"],
    );
    expect(result).toEqual({ ok: false, code: "CONTENT_TYPE_MISMATCH", message: expect.any(String) });
  });

  it("rejects an empty file", () => {
    const result = validateFile(
      pdfFile({ buffer: Buffer.alloc(0), size: 0 }),
      ["pdf"],
    );
    expect(result).toEqual({ ok: false, code: "EMPTY_FILE", message: expect.any(String) });
  });

  it("rejects a kind that isn't in the accepted list even if valid", () => {
    const result = validateFile(pdfFile(), ["jpeg"]);
    expect(result.ok).toBe(false);
  });
});

describe("validateFile — oversized files", () => {
  it("rejects a file over the default size limit", () => {
    const result = validateFile(
      pdfFile({ size: MAX_FILE_SIZE_BYTES + 1 }),
      ["pdf"],
    );
    expect(result).toEqual({ ok: false, code: "FILE_TOO_LARGE", message: expect.any(String) });
  });

  it("rejects a file over a custom, smaller size limit", () => {
    const result = validateFile(pdfFile({ size: 1000 }), ["pdf"], 500);
    expect(result).toEqual({ ok: false, code: "FILE_TOO_LARGE", message: expect.any(String) });
  });

  it("accepts a file exactly at the limit", () => {
    const result = validateFile(pdfFile({ size: 500 }), ["pdf"], 500);
    expect(result.ok).toBe(true);
  });
});

describe("sanitizeFileName — invalid filenames", () => {
  it("strips directory traversal sequences down to a bare basename", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("..\\..\\windows\\system32\\config")).toBe("config");
  });

  it("never returns a name containing a path separator", () => {
    const result = sanitizeFileName("a/b/c/d.pdf");
    expect(result).not.toMatch(/[/\\]/);
  });

  it("strips null bytes and other control characters", () => {
    const withNullByte = `evil${String.fromCharCode(0)}.pdf`;
    expect(sanitizeFileName(withNullByte)).not.toContain(String.fromCharCode(0));
  });

  it("falls back to a default name when nothing safe remains", () => {
    expect(sanitizeFileName("///")).toBe("file");
    expect(sanitizeFileName("")).toBe("file");
  });

  it("truncates excessively long filenames", () => {
    const longName = `${"a".repeat(500)}.pdf`;
    expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(150);
  });

  it("leaves an ordinary filename untouched", () => {
    expect(sanitizeFileName("My Report (final).pdf")).toBe("My Report (final).pdf");
  });
});

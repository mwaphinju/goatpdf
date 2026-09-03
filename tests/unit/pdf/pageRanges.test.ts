import { describe, expect, it } from "vitest";
import { parsePageRanges } from "@/lib/pdf/pageRanges";

describe("parsePageRanges", () => {
  it("parses a single page number", () => {
    expect(parsePageRanges("5", 10)).toEqual({ ok: true, pages: [5] });
  });

  it("parses a simple range", () => {
    expect(parsePageRanges("1-3", 10)).toEqual({ ok: true, pages: [1, 2, 3] });
  });

  it("parses a comma-separated mix of pages and ranges", () => {
    expect(parsePageRanges("1-3, 5, 7-9", 10)).toEqual({ ok: true, pages: [1, 2, 3, 5, 7, 8, 9] });
  });

  it("parses newline-separated pages and ranges", () => {
    expect(parsePageRanges("1-3\n5\n7-9", 10)).toEqual({ ok: true, pages: [1, 2, 3, 5, 7, 8, 9] });
  });

  it("tolerates extra whitespace around tokens and dashes", () => {
    expect(parsePageRanges("  1 - 3 ,  5  ", 10)).toEqual({ ok: true, pages: [1, 2, 3, 5] });
  });

  it("tolerates a trailing comma or blank lines", () => {
    expect(parsePageRanges("1-3, 5,\n\n", 10)).toEqual({ ok: true, pages: [1, 2, 3, 5] });
  });

  it("allows a single-page range written as N-N", () => {
    expect(parsePageRanges("4-4", 10)).toEqual({ ok: true, pages: [4] });
  });

  it("allows overlapping/duplicate pages, preserved in the order given", () => {
    expect(parsePageRanges("1-3, 2", 10)).toEqual({ ok: true, pages: [1, 2, 3, 2] });
  });

  it("rejects empty input", () => {
    const result = parsePageRanges("", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects whitespace-only input", () => {
    const result = parsePageRanges("   \n  ", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-numeric token", () => {
    const result = parsePageRanges("abc", 10);
    expect(result).toEqual({ ok: false, error: expect.stringContaining('"abc"') });
  });

  it("rejects page 0", () => {
    const result = parsePageRanges("0", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects a negative-looking token", () => {
    const result = parsePageRanges("-3", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects a reversed range", () => {
    const result = parsePageRanges("5-3", 10);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("start page") });
  });

  it("rejects a page number beyond the document's page count", () => {
    const result = parsePageRanges("11", 10);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("10 pages") });
  });

  it("rejects a range that's only partially out of bounds", () => {
    const result = parsePageRanges("7-20", 10);
    expect(result.ok).toBe(false);
  });

  it("uses singular phrasing for a 1-page document", () => {
    const result = parsePageRanges("2", 1);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("1 page.") });
  });

  it("reports the first invalid token when multiple are present", () => {
    const result = parsePageRanges("1-3, xyz, 5", 10);
    expect(result).toEqual({ ok: false, error: expect.stringContaining('"xyz"') });
  });
});

describe("parsePageRanges with locale: \"de\" (used by the German Split PDF page)", () => {
  it("still parses valid input the same way regardless of locale", () => {
    expect(parsePageRanges("1-3, 5", 10, "de")).toEqual({ ok: true, pages: [1, 2, 3, 5] });
  });

  it("returns a German error message for empty input", () => {
    const result = parsePageRanges("", 10, "de");
    expect(result).toEqual({ ok: false, error: expect.stringContaining("Seite") });
  });

  it("returns a German error message for a page beyond the document's page count", () => {
    const result = parsePageRanges("11", 10, "de");
    expect(result).toEqual({ ok: false, error: expect.stringContaining("Seiten") });
  });

  it("defaults to English when no locale is passed, so the server-side authoritative check is unaffected", () => {
    const result = parsePageRanges("11", 10);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("pages") });
  });
});

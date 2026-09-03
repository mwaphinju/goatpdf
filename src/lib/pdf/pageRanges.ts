/**
 * Parses a page-range string like "1-3, 5, 7-9" (commas or newlines as
 * separators) into an ordered list of 1-indexed page numbers. Pure and
 * dependency-free so it can run identically on the client (instant
 * feedback) and the server (the authoritative check).
 */
export interface ParsedPageRanges {
  ok: true;
  pages: number[];
}

export interface InvalidPageRanges {
  ok: false;
  error: string;
}

export type PageRangesResult = ParsedPageRanges | InvalidPageRanges;

const TOKEN_PATTERN = /^(\d+)(?:\s*-\s*(\d+))?$/;

export function parsePageRanges(input: string, pageCount: number): PageRangesResult {
  const tokens = input
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return { ok: false, error: "Enter at least one page or range, e.g. 1-3, 5, 7-9." };
  }

  const pages: number[] = [];

  for (const token of tokens) {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) {
      return {
        ok: false,
        error: `"${token}" isn't a valid page or range. Use a page number like 5 or a range like 1-3.`,
      };
    }

    const start = Number(match[1]);
    const end = match[2] !== undefined ? Number(match[2]) : start;

    if (start < 1 || end < 1) {
      return { ok: false, error: `"${token}": page numbers start at 1.` };
    }
    if (start > end) {
      return { ok: false, error: `"${token}": the start page can't be greater than the end page.` };
    }
    if (end > pageCount) {
      return {
        ok: false,
        error: `"${token}": this PDF only has ${pageCount} page${pageCount === 1 ? "" : "s"}.`,
      };
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
  }

  return { ok: true, pages };
}

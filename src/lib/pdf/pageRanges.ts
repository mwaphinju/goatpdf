import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

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

const MESSAGES = {
  en: {
    empty: "Enter at least one page or range, e.g. 1-3, 5, 7-9.",
    invalidToken: (token: string) => `"${token}" isn't a valid page or range. Use a page number like 5 or a range like 1-3.`,
    startsAtOne: (token: string) => `"${token}": page numbers start at 1.`,
    startAfterEnd: (token: string) => `"${token}": the start page can't be greater than the end page.`,
    beyondPageCount: (token: string, pageCount: number) =>
      `"${token}": this PDF only has ${pageCount} page${pageCount === 1 ? "" : "s"}.`,
  },
  de: {
    empty: "Gib mindestens eine Seite oder einen Bereich an, z. B. 1-3, 5, 7-9.",
    invalidToken: (token: string) => `"${token}" ist keine gültige Seite oder kein gültiger Bereich. Verwende eine Seitenzahl wie 5 oder einen Bereich wie 1-3.`,
    startsAtOne: (token: string) => `"${token}": Seitenzahlen beginnen bei 1.`,
    startAfterEnd: (token: string) => `"${token}": Die Startseite darf nicht größer als die Endseite sein.`,
    beyondPageCount: (token: string, pageCount: number) =>
      `"${token}": Diese PDF-Datei hat nur ${pageCount} Seite${pageCount === 1 ? "" : "n"}.`,
  },
} as const;

/** `locale` defaults to English; every existing call site (including the server-side authoritative check) omits it and is unaffected. */
export function parsePageRanges(input: string, pageCount: number, locale: Locale = DEFAULT_LOCALE): PageRangesResult {
  const messages = MESSAGES[locale];
  const tokens = input
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return { ok: false, error: messages.empty };
  }

  const pages: number[] = [];

  for (const token of tokens) {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) {
      return { ok: false, error: messages.invalidToken(token) };
    }

    const start = Number(match[1]);
    const end = match[2] !== undefined ? Number(match[2]) : start;

    if (start < 1 || end < 1) {
      return { ok: false, error: messages.startsAtOne(token) };
    }
    if (start > end) {
      return { ok: false, error: messages.startAfterEnd(token) };
    }
    if (end > pageCount) {
      return { ok: false, error: messages.beyondPageCount(token, pageCount) };
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
  }

  return { ok: true, pages };
}

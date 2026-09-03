/**
 * Maps the 5 launched German pages to their exact English counterpart and
 * back, for the language selector and hreflang. Only these 5 pairs exist;
 * every other English page has no German counterpart yet, and every
 * other German path simply doesn't exist (see
 * GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md for the full launched set).
 */
export const EN_TO_DE_PATH: Record<string, string> = {
  "/": "/de",
  "/tools/compress-pdf": "/de/tools/pdf-komprimieren",
  "/tools/merge-pdf": "/de/tools/pdf-zusammenfuegen",
  "/tools/split-pdf": "/de/tools/pdf-teilen",
  "/tools/pdf-to-word": "/de/tools/pdf-in-word",
};

export const DE_TO_EN_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_DE_PATH).map(([en, de]) => [de, en]),
);

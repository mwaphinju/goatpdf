export interface LocalizedToolFaq {
  question: string;
  answer: string;
}

/**
 * The localizable subset of lib/tools.ts's ToolDefinition: everything a
 * tool page's on-page content and metadata need, minus the fields that
 * don't vary by locale (slug, accept, multiple, icon, actionLabel is
 * covered by each tool component's own COPY object instead since it
 * depends on interactive state).
 */
export interface LocalizedToolContent {
  name: string;
  seoTitle: string;
  metaDescription: string;
  supportedFormats: string;
  whyUseIt: string[];
  useCases: string[];
  intro: string;
  howTo: string[];
  faqs: LocalizedToolFaq[];
}

/** The 4 tools launched in German as of Week 2 Day 5. See GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md. */
export const LAUNCHED_GERMAN_TOOL_SLUGS = ["compress-pdf", "merge-pdf", "split-pdf", "pdf-to-word"] as const;

export type LaunchedGermanToolSlug = (typeof LAUNCHED_GERMAN_TOOL_SLUGS)[number];

export const GERMAN_TOOL_ROUTES: Record<LaunchedGermanToolSlug, string> = {
  "compress-pdf": "/de/tools/pdf-komprimieren",
  "merge-pdf": "/de/tools/pdf-zusammenfuegen",
  "split-pdf": "/de/tools/pdf-teilen",
  "pdf-to-word": "/de/tools/pdf-in-word",
};

export const ENGLISH_TOOL_ROUTES: Record<LaunchedGermanToolSlug, string> = {
  "compress-pdf": "/tools/compress-pdf",
  "merge-pdf": "/tools/merge-pdf",
  "split-pdf": "/tools/split-pdf",
  "pdf-to-word": "/tools/pdf-to-word",
};

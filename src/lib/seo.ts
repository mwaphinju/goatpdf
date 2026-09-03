import type { Metadata } from "next";
import type { ToolDefinition } from "@/lib/tools";
import { DEFAULT_LOCALE, LOCALE_OG_MAP, type Locale } from "@/i18n/config";
import { buildHreflangLanguages, type LocalizedPaths } from "@/i18n/hreflang";

// Not deployed yet (see CLAUDE.md), so there is no confirmed production
// domain. This placeholder keeps metadataBase/canonical/OG URLs well-formed
// during development; set NEXT_PUBLIC_SITE_URL to the real domain before
// launch, matching the placeholder used for the contact email in Phase 10.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://goatpdf.app";
export const SITE_NAME = "GOAT PDF";

/** Resolves a site-relative path to a fully-qualified URL, needed for structured data, which Next does not resolve automatically the way it does metadataBase-relative Metadata fields. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// A page that sets its own `openGraph`/`twitter` metadata object doesn't
// inherit the root layout's file-convention-based opengraph-image: Next
// only auto-attaches that fallback when a route defines no openGraph object
// of its own at all. Every page here does define one (for its own
// title/description/url), so the shared social-preview image has to be
// referenced explicitly, every time, to actually show up.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "GOAT PDF: Free PDF Tools That Just Work" };

/**
 * Shared page metadata shape: title, description, canonical, Open Graph,
 * and Twitter card, everything but the fields a specific page wants to
 * add itself.
 *
 * `locale` and `alternateLanguages` are optional and unused by every
 * current call site, which keeps every existing page's output
 * byte-for-byte identical to before locale support existed. They exist
 * so a future localized page can call this same function instead of a
 * duplicated locale-aware version: pass `locale: "de"` plus a map of
 * `{ en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" }` and
 * this function emits the matching `og:locale` and hreflang alternates,
 * filtered through buildHreflangLanguages so a not-yet-ready locale (see
 * READY_LOCALES in @/i18n/config) can never actually appear in the
 * output even if a caller passes its path here early.
 */
export function buildPageMetadata({
  path,
  title,
  description,
  locale = DEFAULT_LOCALE,
  alternateLanguages,
}: {
  path: string;
  title: string;
  description: string;
  locale?: Locale;
  alternateLanguages?: LocalizedPaths;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const languages = alternateLanguages ? buildHreflangLanguages(alternateLanguages, absoluteUrl) : undefined;

  return {
    title,
    description,
    alternates: languages ? { canonical: path, languages } : { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: LOCALE_OG_MAP[locale],
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * Same shape as buildPageMetadata, for the /blog/* guide articles. Kept
 * separate because these pages are genuinely article content, not tool/app
 * pages: openGraph.type is "article" here (vs. "website" for the rest of
 * the site), and `title: { absolute: ... }` sets the exact rendered <title>
 * directly rather than going through the root layout's title template.
 */
export function buildArticleMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "article",
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export function buildToolMetadata(tool: ToolDefinition, alternateLanguages?: LocalizedPaths): Metadata {
  return buildPageMetadata({
    path: `/tools/${tool.slug}`,
    // seoTitle/metaDescription are written for search intent and result-page
    // copy specifically: distinct from tool.name/description, which stay
    // the on-page H1 and card text, so this never changes anything visible
    // in the UI.
    title: tool.seoTitle,
    description: tool.metaDescription,
    alternateLanguages,
  });
}

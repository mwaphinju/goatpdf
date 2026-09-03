import type { Metadata } from "next";
import type { ToolDefinition } from "@/lib/tools";

// Not deployed yet (see CLAUDE.md), so there is no confirmed production
// domain. This placeholder keeps metadataBase/canonical/OG URLs well-formed
// during development; set NEXT_PUBLIC_SITE_URL to the real domain before
// launch, matching the placeholder used for the contact email in Phase 10.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://goatpdf.app";
export const SITE_NAME = "GOAT PDF";

/** Resolves a site-relative path to a fully-qualified URL — needed for structured data, which Next does not resolve automatically the way it does metadataBase-relative Metadata fields. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// A page that sets its own `openGraph`/`twitter` metadata object doesn't
// inherit the root layout's file-convention-based opengraph-image — Next
// only auto-attaches that fallback when a route defines no openGraph object
// of its own at all. Every page here does define one (for its own
// title/description/url), so the shared social-preview image has to be
// referenced explicitly, every time, to actually show up.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "GOAT PDF — Free PDF Tools That Just Work" };

/** Shared page metadata shape: title, description, canonical, Open Graph, and Twitter card — everything but the fields a specific page wants to add itself. */
export function buildPageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
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

/**
 * Same shape as buildPageMetadata, for the /blog/* guide articles added in
 * Week 2 Day 3. Kept separate rather than reusing buildPageMetadata, since
 * that function's brand suffix (see fullTitle above) uses an em dash
 * character as its separator, and these articles have an explicit,
 * absolute requirement to contain zero em dashes anywhere, including in
 * the rendered <title> tag. Using `title: { absolute: ... }` bypasses the
 * root layout's title template for these pages specifically, without
 * changing that template, or any other page's titles, at all.
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
  // Same image as OG_IMAGE above, but with its own alt text. OG_IMAGE's alt
  // string contains an em dash character, and this function exists
  // specifically to keep that character out of these pages' output.
  const articleOgImage = { ...OG_IMAGE, alt: "GOAT PDF: Free PDF Tools That Just Work" };

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
      images: [articleOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export function buildToolMetadata(tool: ToolDefinition): Metadata {
  return buildPageMetadata({
    path: `/tools/${tool.slug}`,
    // seoTitle/metaDescription are written for search intent and result-page
    // copy specifically — distinct from tool.name/description, which stay
    // the on-page H1 and card text, so this never changes anything visible
    // in the UI.
    title: tool.seoTitle,
    description: tool.metaDescription,
  });
}

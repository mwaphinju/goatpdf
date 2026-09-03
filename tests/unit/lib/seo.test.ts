import { describe, expect, it } from "vitest";
import { absoluteUrl, buildPageMetadata, buildToolMetadata, SITE_URL } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

describe("absoluteUrl", () => {
  it("resolves a site-relative path against SITE_URL", () => {
    expect(absoluteUrl("/tools/merge-pdf")).toBe(`${SITE_URL}/tools/merge-pdf`);
  });

  it("resolves the root path", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_URL}/`);
  });
});

describe("buildPageMetadata", () => {
  it("sets a canonical alternate matching the given path", () => {
    const metadata = buildPageMetadata({ path: "/privacy", title: "Privacy Policy", description: "desc" });
    expect(metadata.alternates).toEqual({ canonical: "/privacy" });
  });

  it("sets matching title/description/url across openGraph and twitter", () => {
    const metadata = buildPageMetadata({ path: "/terms", title: "Terms", description: "The terms." });

    expect(metadata.title).toBe("Terms");
    expect(metadata.description).toBe("The terms.");
    expect(metadata.openGraph).toMatchObject({
      title: "Terms | GOAT PDF",
      description: "The terms.",
      url: "/terms",
      siteName: "GOAT PDF",
      type: "website",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Terms | GOAT PDF",
      description: "The terms.",
    });
  });

  it("references the site's real Open Graph/Twitter image on every page", () => {
    const metadata = buildPageMetadata({ path: "/terms", title: "Terms", description: "The terms." });

    expect(metadata.openGraph?.images).toEqual([
      { url: "/opengraph-image", width: 1200, height: 630, alt: expect.any(String) },
    ]);
    expect(metadata.twitter?.images).toEqual(["/opengraph-image"]);
  });
});

describe("buildPageMetadata locale awareness", () => {
  it("defaults to English's Open Graph locale tag when no locale is given, matching every existing page's call site", () => {
    const metadata = buildPageMetadata({ path: "/terms", title: "Terms", description: "The terms." });
    expect(metadata.openGraph).toMatchObject({ locale: "en_US" });
  });

  it("omits alternates.languages entirely when no alternateLanguages are given", () => {
    const metadata = buildPageMetadata({ path: "/terms", title: "Terms", description: "The terms." });
    expect(metadata.alternates).toEqual({ canonical: "/terms" });
  });

  it("still omits alternates.languages when alternateLanguages only has English, since German isn't ready", () => {
    const metadata = buildPageMetadata({
      path: "/tools/compress-pdf",
      title: "Compress PDF",
      description: "desc",
      alternateLanguages: { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
    });
    expect(metadata.alternates).toEqual({ canonical: "/tools/compress-pdf" });
  });

  it("sets the requested locale's Open Graph tag when one is explicitly passed", () => {
    const metadata = buildPageMetadata({
      path: "/tools/compress-pdf",
      title: "Compress PDF",
      description: "desc",
      locale: "de",
    });
    expect(metadata.openGraph).toMatchObject({ locale: "de_DE" });
  });
});

describe("buildToolMetadata", () => {
  it("builds metadata pointing at the tool's own /tools/<slug> path", () => {
    const tool = getToolBySlug("compress-pdf")!;
    const metadata = buildToolMetadata(tool);

    expect(metadata.alternates).toEqual({ canonical: "/tools/compress-pdf" });
    // Uses the SEO-specific seoTitle/metaDescription, not the on-page
    // name/description — search-result copy can be tuned for intent
    // ("online free") without touching anything visible in the UI.
    expect(metadata.title).toBe(tool.seoTitle);
    expect(metadata.description).toBe(tool.metaDescription);
  });
});

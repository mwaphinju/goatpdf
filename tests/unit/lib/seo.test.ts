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
      title: "Terms — GOAT PDF",
      description: "The terms.",
      url: "/terms",
      siteName: "GOAT PDF",
      type: "website",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Terms — GOAT PDF",
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

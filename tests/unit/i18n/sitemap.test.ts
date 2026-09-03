import { describe, expect, it, vi } from "vitest";
import { localizedSitemapEntries } from "@/i18n/sitemap";

const absoluteUrl = (path: string) => `https://goatpdf.app${path}`;
const options = { absoluteUrl, changeFrequency: "monthly" as const, priority: 0.9 };

describe("localizedSitemapEntries (real config: English and German are both ready, as of Week 2 Day 5)", () => {
  it("emits one entry per ready locale that has a real path", () => {
    const entries = localizedSitemapEntries(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      options,
    );

    expect(entries).toEqual([
      { url: "https://goatpdf.app/tools/compress-pdf", changeFrequency: "monthly", priority: 0.9 },
      { url: "https://goatpdf.app/de/tools/pdf-komprimieren", changeFrequency: "monthly", priority: 0.9 },
    ]);
  });

  it("emits nothing for an empty path set", () => {
    expect(localizedSitemapEntries({}, options)).toEqual([]);
  });

  it("emits only the German entry when only a German path is supplied (the pattern src/app/sitemap.ts actually uses, since English pages are already listed separately)", () => {
    expect(localizedSitemapEntries({ de: "/de/tools/pdf-komprimieren" }, options)).toEqual([
      { url: "https://goatpdf.app/de/tools/pdf-komprimieren", changeFrequency: "monthly", priority: 0.9 },
    ]);
  });
});

describe("localizedSitemapEntries when a locale is not (or no longer) ready", () => {
  it("excludes a locale's entry even though its path is supplied, once it's outside READY_LOCALES", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/config", async () => {
      const actual = await vi.importActual<typeof import("@/i18n/config")>("@/i18n/config");
      return { ...actual, READY_LOCALES: ["en"] };
    });

    const { localizedSitemapEntries: withOnlyEnglishReady } = await import("@/i18n/sitemap");
    const entries = withOnlyEnglishReady(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      options,
    );

    expect(entries).toEqual([{ url: "https://goatpdf.app/tools/compress-pdf", changeFrequency: "monthly", priority: 0.9 }]);

    vi.doUnmock("@/i18n/config");
    vi.resetModules();
  });
});

import { describe, expect, it, vi } from "vitest";
import { buildHreflangLanguages } from "@/i18n/hreflang";

const absoluteUrl = (path: string) => `https://goatpdf.app${path}`;

describe("buildHreflangLanguages (real config: English and German are both ready, as of Week 2 Day 5)", () => {
  it("returns undefined for an English-only path set, since a single-locale hreflang set says nothing new", () => {
    expect(buildHreflangLanguages({ en: "/tools/compress-pdf" }, absoluteUrl)).toBeUndefined();
  });

  it("emits both locale alternates plus x-default when both a real English and German path are given", () => {
    expect(buildHreflangLanguages({ en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" }, absoluteUrl)).toEqual({
      en: "https://goatpdf.app/tools/compress-pdf",
      de: "https://goatpdf.app/de/tools/pdf-komprimieren",
      "x-default": "https://goatpdf.app/tools/compress-pdf",
    });
  });

  it("returns undefined for an empty path set", () => {
    expect(buildHreflangLanguages({}, absoluteUrl)).toBeUndefined();
  });

  it("does not emit a German alternate for a page that has no German path at all (e.g. Rotate PDF, not launched in German)", () => {
    expect(buildHreflangLanguages({ en: "/tools/rotate-pdf" }, absoluteUrl)).toBeUndefined();
  });
});

describe("buildHreflangLanguages when a locale is not (or no longer) ready", () => {
  it("excludes a locale's alternate even though its path is supplied, once it's outside READY_LOCALES", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/config", async () => {
      const actual = await vi.importActual<typeof import("@/i18n/config")>("@/i18n/config");
      return { ...actual, READY_LOCALES: ["en"] };
    });

    const { buildHreflangLanguages: buildWithOnlyEnglishReady } = await import("@/i18n/hreflang");
    const result = buildWithOnlyEnglishReady(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      absoluteUrl,
    );

    expect(result).toBeUndefined();

    vi.doUnmock("@/i18n/config");
    vi.resetModules();
  });
});

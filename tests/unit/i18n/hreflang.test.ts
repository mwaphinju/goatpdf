import { describe, expect, it, vi } from "vitest";
import { buildHreflangLanguages } from "@/i18n/hreflang";

const absoluteUrl = (path: string) => `https://goatpdf.app${path}`;

describe("buildHreflangLanguages (real config: only English is ready)", () => {
  it("returns undefined for an English-only path set, since a single-locale hreflang set says nothing new", () => {
    expect(buildHreflangLanguages({ en: "/tools/compress-pdf" }, absoluteUrl)).toBeUndefined();
  });

  it("returns undefined even when a German path is supplied, because German isn't in READY_LOCALES yet", () => {
    expect(
      buildHreflangLanguages({ en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" }, absoluteUrl),
    ).toBeUndefined();
  });

  it("returns undefined for an empty path set", () => {
    expect(buildHreflangLanguages({}, absoluteUrl)).toBeUndefined();
  });
});

describe("buildHreflangLanguages once a second locale is marked ready", () => {
  it("emits both locale alternates plus x-default pointing at the default locale's URL", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/config", async () => {
      const actual = await vi.importActual<typeof import("@/i18n/config")>("@/i18n/config");
      return { ...actual, READY_LOCALES: ["en", "de"] };
    });

    const { buildHreflangLanguages: buildWithGermanReady } = await import("@/i18n/hreflang");
    const result = buildWithGermanReady(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      absoluteUrl,
    );

    expect(result).toEqual({
      en: "https://goatpdf.app/tools/compress-pdf",
      de: "https://goatpdf.app/de/tools/pdf-komprimieren",
      "x-default": "https://goatpdf.app/tools/compress-pdf",
    });

    vi.doUnmock("@/i18n/config");
    vi.resetModules();
  });
});

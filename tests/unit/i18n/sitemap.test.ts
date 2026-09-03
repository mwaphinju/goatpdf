import { describe, expect, it, vi } from "vitest";
import { localizedSitemapEntries } from "@/i18n/sitemap";

const absoluteUrl = (path: string) => `https://goatpdf.app${path}`;
const options = { absoluteUrl, changeFrequency: "monthly" as const, priority: 0.9 };

describe("localizedSitemapEntries (real config: only English is ready)", () => {
  it("emits only the English entry, even when a German path is also supplied", () => {
    const entries = localizedSitemapEntries(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      options,
    );

    expect(entries).toEqual([{ url: "https://goatpdf.app/tools/compress-pdf", changeFrequency: "monthly", priority: 0.9 }]);
  });

  it("emits nothing for a path set with no ready-locale entry", () => {
    expect(localizedSitemapEntries({ de: "/de/tools/pdf-komprimieren" }, options)).toEqual([]);
  });
});

describe("localizedSitemapEntries once a second locale is marked ready", () => {
  it("emits one sitemap entry per ready locale that has a real path", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/config", async () => {
      const actual = await vi.importActual<typeof import("@/i18n/config")>("@/i18n/config");
      return { ...actual, READY_LOCALES: ["en", "de"] };
    });

    const { localizedSitemapEntries: withGermanReady } = await import("@/i18n/sitemap");
    const entries = withGermanReady(
      { en: "/tools/compress-pdf", de: "/de/tools/pdf-komprimieren" },
      options,
    );

    expect(entries).toEqual([
      { url: "https://goatpdf.app/tools/compress-pdf", changeFrequency: "monthly", priority: 0.9 },
      { url: "https://goatpdf.app/de/tools/pdf-komprimieren", changeFrequency: "monthly", priority: 0.9 },
    ]);

    vi.doUnmock("@/i18n/config");
    vi.resetModules();
  });
});

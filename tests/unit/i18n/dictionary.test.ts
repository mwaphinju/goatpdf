import { describe, expect, it, vi } from "vitest";
import { getDictionary, interpolate, type MissingTranslationKey } from "@/i18n/dictionary";

function everyStringValue(record: Record<string, unknown>): string[] {
  return Object.values(record).flatMap((section) => Object.values(section as Record<string, string>));
}

describe("getDictionary", () => {
  it("returns the complete, real English dictionary with no empty values", () => {
    const en = getDictionary("en");
    for (const value of everyStringValue(en as unknown as Record<string, unknown>)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("uses the reviewed German value for keys German actually defines", () => {
    const de = getDictionary("de");
    expect(de.buttons.download).toBe("Herunterladen");
    expect(de.navigation.allTools).toBe("Alle Tools");
  });

  it("falls back to the English value for a key a locale doesn't define, never an empty string or a raw key", async () => {
    // The real de.ts is, as of Week 2 Day 5, a complete translation of
    // every key used on the 5 launched German pages (see its own
    // top-of-file comment), so this test simulates a locale with a
    // genuine gap instead, to verify the fallback mechanism itself
    // rather than depending on today's content happening to be
    // incomplete somewhere.
    vi.resetModules();
    vi.doMock("@/i18n/dictionaries/de", () => ({ de: { footer: {} } }));

    const { getDictionary: getDictionaryWithGap } = await import("@/i18n/dictionary");
    const en = getDictionaryWithGap("en");
    const deWithGap = getDictionaryWithGap("de");

    expect(deWithGap.footer.description).toBe(en.footer.description);
    expect(deWithGap.footer.description).not.toBe("");
    expect(deWithGap.footer.description).not.toContain("footer.description");

    vi.doUnmock("@/i18n/dictionaries/de");
    vi.resetModules();
  });

  it("never returns undefined, an empty string, or a dotted key for any Dictionary field in any supported locale", () => {
    for (const locale of ["en", "de"] as const) {
      const dict = getDictionary(locale);
      for (const value of everyStringValue(dict as unknown as Record<string, unknown>)) {
        expect(value).toBeTruthy();
        expect(value).not.toMatch(/^[a-z]+\.[a-zA-Z]+$/);
      }
    }
  });

  it("reports every key it had to fall back on, for a locale with incomplete coverage", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/dictionaries/de", () => ({ de: { footer: {} } }));

    const { getDictionary: getDictionaryWithGap } = await import("@/i18n/dictionary");
    const missing: MissingTranslationKey[] = [];
    getDictionaryWithGap("de", { onMissing: (entry) => missing.push(entry) });

    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((entry) => entry.section === "footer" && entry.key === "description")).toBe(true);

    vi.doUnmock("@/i18n/dictionaries/de");
    vi.resetModules();
  });

  it("never reports a fallback for English itself, the source of truth", () => {
    const onMissing = vi.fn();
    getDictionary("en", { onMissing });
    expect(onMissing).not.toHaveBeenCalled();
  });

  it("logs a dev-mode warning for a missing key when no onMissing override is given", async () => {
    vi.resetModules();
    vi.doMock("@/i18n/dictionaries/de", () => ({ de: { footer: {} } }));

    const { getDictionary: getDictionaryWithGap } = await import("@/i18n/dictionary");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    getDictionaryWithGap("de");
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes("footer.description"))).toBe(true);
    warnSpy.mockRestore();

    vi.doUnmock("@/i18n/dictionaries/de");
    vi.resetModules();
  });
});

describe("interpolate", () => {
  it("fills a named placeholder", () => {
    expect(interpolate("Page {n} of {total}", { n: 2, total: 5 })).toBe("Page 2 of 5");
  });

  it("leaves an unknown placeholder untouched rather than throwing", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });
});

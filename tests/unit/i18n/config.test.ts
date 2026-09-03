import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_NAMES,
  LOCALE_OG_MAP,
  READY_LOCALES,
  SUPPORTED_LOCALES,
  isLocaleReady,
  isSupportedLocale,
} from "@/i18n/config";

describe("locale configuration", () => {
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("supports English and German, both ready for public use as of Week 2 Day 5", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "de"]);
    expect(READY_LOCALES).toEqual(["en", "de"]);
  });

  it("reports both English and German as ready", () => {
    expect(isLocaleReady("en")).toBe(true);
    expect(isLocaleReady("de")).toBe(true);
  });

  it("has a display name and an Open Graph locale tag for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      expect(LOCALE_OG_MAP[locale]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });

  it("identifies supported vs. unsupported locale strings", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });
});

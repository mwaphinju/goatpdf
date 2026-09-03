import { describe, expect, it } from "vitest";
import { DE_TO_EN_PATH, EN_TO_DE_PATH } from "@/i18n/pageMap";

describe("EN_TO_DE_PATH / DE_TO_EN_PATH", () => {
  it("maps exactly the 5 launched pages", () => {
    expect(Object.keys(EN_TO_DE_PATH).sort()).toEqual(
      ["/", "/tools/compress-pdf", "/tools/merge-pdf", "/tools/split-pdf", "/tools/pdf-to-word"].sort(),
    );
  });

  it("is a consistent, reversible mapping in both directions", () => {
    for (const [en, de] of Object.entries(EN_TO_DE_PATH)) {
      expect(DE_TO_EN_PATH[de]).toBe(en);
    }
    expect(Object.keys(DE_TO_EN_PATH)).toHaveLength(Object.keys(EN_TO_DE_PATH).length);
  });

  it("every German path starts with /de", () => {
    for (const de of Object.values(EN_TO_DE_PATH)) {
      expect(de.startsWith("/de")).toBe(true);
    }
  });
});

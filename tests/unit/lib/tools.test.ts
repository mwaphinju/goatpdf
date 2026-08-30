import { describe, expect, it } from "vitest";
import { getRelatedTools, getToolBySlug, tools } from "@/lib/tools";

describe("tools registry", () => {
  it("has a unique slug for every tool", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every tool exactly 3 curated, valid, non-self related slugs with no duplicates", () => {
    const allSlugs = new Set(tools.map((tool) => tool.slug));

    for (const tool of tools) {
      expect(tool.relatedSlugs).toHaveLength(3);
      expect(new Set(tool.relatedSlugs).size).toBe(3);
      expect(tool.relatedSlugs).not.toContain(tool.slug);
      for (const relatedSlug of tool.relatedSlugs) {
        expect(allSlugs.has(relatedSlug)).toBe(true);
      }
    }
  });

  it("gives every tool a non-empty intro, at least 2 how-to steps, and at least 1 FAQ", () => {
    for (const tool of tools) {
      expect(tool.intro.length).toBeGreaterThan(0);
      expect(tool.howTo.length).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getToolBySlug", () => {
  it("finds a real tool by slug", () => {
    expect(getToolBySlug("merge-pdf")?.name).toBe("Merge PDF");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getToolBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getRelatedTools", () => {
  it("resolves a tool's curated relatedSlugs into full ToolDefinitions, in order", () => {
    const tool = getToolBySlug("merge-pdf")!;
    const related = getRelatedTools("merge-pdf");

    expect(related.map((r) => r.slug)).toEqual(tool.relatedSlugs);
  });

  it("returns an empty array for an unknown slug", () => {
    expect(getRelatedTools("does-not-exist")).toEqual([]);
  });
});

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

  it("gives every tool a non-empty intro, at least 2 how-to steps, and 4-6 genuinely distinct FAQs", () => {
    for (const tool of tools) {
      expect(tool.intro.length).toBeGreaterThan(0);
      expect(tool.howTo.length).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length).toBeGreaterThanOrEqual(4);
      expect(tool.faqs.length).toBeLessThanOrEqual(6);

      const questions = tool.faqs.map((faq) => faq.question);
      expect(new Set(questions).size).toBe(questions.length);
      for (const faq of tool.faqs) {
        expect(faq.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every tool at least 3 genuine reasons to use it", () => {
    for (const tool of tools) {
      expect(tool.whyUseIt.length).toBeGreaterThanOrEqual(3);
      for (const reason of tool.whyUseIt) {
        expect(reason.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every tool a distinct, non-empty seoTitle and metaDescription, separate from its on-page name/description", () => {
    const seoTitles = new Set<string>();
    const metaDescriptions = new Set<string>();

    for (const tool of tools) {
      expect(tool.seoTitle.length).toBeGreaterThan(0);
      expect(tool.metaDescription.length).toBeGreaterThan(0);
      seoTitles.add(tool.seoTitle);
      metaDescriptions.add(tool.metaDescription);
    }

    expect(seoTitles.size).toBe(tools.length);
    expect(metaDescriptions.size).toBe(tools.length);
  });

  it("gives every tool a supportedFormats statement and at least 2 concrete use cases", () => {
    for (const tool of tools) {
      expect(tool.supportedFormats.length).toBeGreaterThan(0);
      expect(tool.useCases.length).toBeGreaterThanOrEqual(2);
      for (const useCase of tool.useCases) {
        expect(useCase.length).toBeGreaterThan(0);
      }
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

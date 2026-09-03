import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/seo";
import {
  toolBreadcrumbStructuredData,
  toolFaqStructuredData,
  toolListStructuredData,
  toolSoftwareApplicationStructuredData,
  websiteStructuredData,
} from "@/lib/structuredData";
import { getToolBySlug, tools } from "@/lib/tools";

const mergeTool = getToolBySlug("merge-pdf")!;

describe("websiteStructuredData", () => {
  it("describes the site with a WebSite type and the real site URL", () => {
    const data = websiteStructuredData();
    expect(data["@type"]).toBe("WebSite");
    expect(data.url).toBe(SITE_URL);
    expect(data.name).toBe("GOAT PDF");
  });
});

describe("toolListStructuredData", () => {
  it("lists every tool, in registry order, with a fully-qualified URL each", () => {
    const data = toolListStructuredData();
    expect(data["@type"]).toBe("ItemList");
    expect(data.itemListElement).toHaveLength(tools.length);
    expect(data.itemListElement[0]).toMatchObject({
      position: 1,
      name: tools[0].name,
      url: `${SITE_URL}/tools/${tools[0].slug}`,
    });
  });
});

describe("toolSoftwareApplicationStructuredData", () => {
  it("builds a free-offer WebApplication entry for the given tool", () => {
    const data = toolSoftwareApplicationStructuredData(mergeTool);
    // WebApplication (not the more generic SoftwareApplication) — this tool
    // runs entirely in the browser, nothing to install.
    expect(data["@type"]).toBe("WebApplication");
    expect(data.applicationCategory).toBe("UtilitiesApplication");
    expect(data.url).toBe(`${SITE_URL}/tools/merge-pdf`);
    expect(data.description).toBe(mergeTool.description);
    expect(data.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
  });
});

describe("locale-aware structured data", () => {
  it("omits inLanguage when no locale is passed, matching every existing page's call site", () => {
    expect(websiteStructuredData()).not.toHaveProperty("inLanguage");
    expect(toolSoftwareApplicationStructuredData(mergeTool)).not.toHaveProperty("inLanguage");
  });

  it("adds inLanguage only when a locale is explicitly passed", () => {
    expect(websiteStructuredData("en")).toMatchObject({ inLanguage: "en" });
    expect(toolSoftwareApplicationStructuredData(mergeTool, "de")).toMatchObject({ inLanguage: "de" });
  });
});

describe("toolBreadcrumbStructuredData", () => {
  it("builds a two-level Home > Tool breadcrumb", () => {
    const data = toolBreadcrumbStructuredData(mergeTool);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Merge PDF", item: `${SITE_URL}/tools/merge-pdf` },
    ]);
  });
});

describe("toolFaqStructuredData", () => {
  it("maps each tool FAQ into a Question/Answer pair", () => {
    const data = toolFaqStructuredData(mergeTool)!;
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(mergeTool.faqs.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: mergeTool.faqs[0].question,
      acceptedAnswer: { "@type": "Answer", text: mergeTool.faqs[0].answer },
    });
  });

  it("returns null rather than an empty FAQPage when a tool has no FAQs", () => {
    const toolWithNoFaqs = { ...mergeTool, faqs: [] };
    expect(toolFaqStructuredData(toolWithNoFaqs)).toBeNull();
  });
});

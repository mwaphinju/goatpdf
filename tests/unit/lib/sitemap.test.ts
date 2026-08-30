import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/seo";
import { tools } from "@/lib/tools";

describe("sitemap", () => {
  it("includes the homepage and every static/legal page", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/`);
    for (const path of ["/about", "/contact", "/privacy", "/terms"]) {
      expect(urls).toContain(`${SITE_URL}${path}`);
    }
  });

  it("includes every tool page exactly once", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const tool of tools) {
      const toolUrl = `${SITE_URL}/tools/${tool.slug}`;
      expect(urls.filter((url) => url === toolUrl)).toHaveLength(1);
    }
  });

  it("never includes an /api/ URL", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });
});

describe("robots", () => {
  it("allows crawling in general but disallows /api/", () => {
    const { rules } = robots();
    const ruleList = Array.isArray(rules) ? rules : [rules];
    const rule = ruleList[0];

    expect(rule.allow).toBe("/");
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    expect(disallow).toContain("/api/");
  });

  it("points at the real sitemap URL", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

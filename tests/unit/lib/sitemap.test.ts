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

  it("includes exactly the 5 launched German pages, each exactly once, now that German is ready (Week 2 Day 5)", () => {
    const urls = sitemap().map((entry) => entry.url);
    const germanUrls = [
      `${SITE_URL}/de`,
      `${SITE_URL}/de/tools/pdf-komprimieren`,
      `${SITE_URL}/de/tools/pdf-zusammenfuegen`,
      `${SITE_URL}/de/tools/pdf-teilen`,
      `${SITE_URL}/de/tools/pdf-in-word`,
    ];
    for (const url of germanUrls) {
      expect(urls.filter((entry) => entry === url)).toHaveLength(1);
    }
  });

  it("contains no German URL for a tool that wasn't launched in German", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const notLaunched of ["rotate-pdf", "delete-pdf-pages", "jpg-to-pdf", "pdf-to-jpg"]) {
      expect(urls.some((url) => url.includes(`/de/tools/${notLaunched}`))).toBe(false);
    }
  });

  it("has exactly 22 URLs in total: 17 English pages plus the 5 launched German pages", () => {
    expect(sitemap()).toHaveLength(22);
  });

  it("every URL uses the real SITE_URL host, never localhost or a bare fallback", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const url of urls) {
      expect(url.startsWith(SITE_URL)).toBe(true);
      expect(url).not.toContain("localhost");
    }
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

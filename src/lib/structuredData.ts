import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { tools, type ToolDefinition } from "@/lib/tools";

export function websiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Free, fast, mobile-friendly PDF tools — compress, merge, split, rotate, delete pages, and convert PDFs. No account required.",
  };
}

export function toolListStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: absoluteUrl(`/tools/${tool.slug}`),
    })),
  };
}

// WebApplication (a schema.org subtype of SoftwareApplication, specific to
// browser-delivered apps) is the more accurate type for a tool that runs
// entirely as a web page — there's nothing to install, which
// applicationCategory: "UtilitiesApplication" also reflects more precisely
// than the previous "BusinessApplication".
export function toolSoftwareApplicationStructuredData(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${tool.name} — ${SITE_NAME}`,
    description: tool.description,
    url: absoluteUrl(`/tools/${tool.slug}`),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (browser-based)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function toolBreadcrumbStructuredData(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: tool.name, item: absoluteUrl(`/tools/${tool.slug}`) },
    ],
  };
}

/** Returns null (rather than an empty FAQPage) when a tool has no FAQ content, so callers never emit an empty/misleading structured-data block. */
export function toolFaqStructuredData(tool: ToolDefinition) {
  if (tool.faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * For the /blog/* guide articles. author/publisher use this site's own real,
 * already-established identity (the same SITE_NAME used sitewide) rather
 * than an invented person or organization, and datePublished/dateModified
 * are the real date this content was actually written: not a fabricated
 * history, and nothing here is a rating, review, price, or statistic.
 */
export function articleStructuredData({
  path,
  headline,
  description,
  datePublished,
}: {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished,
    dateModified: datePublished,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function articleBreadcrumbStructuredData({ path, title }: { path: string; title: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: title, item: absoluteUrl(path) },
    ],
  };
}

/** Same shape as toolFaqStructuredData, generalized for an article's own small FAQ block. Returns null rather than an empty FAQPage when a page has no FAQ content. */
export function genericFaqStructuredData(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

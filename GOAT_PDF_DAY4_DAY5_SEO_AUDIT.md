# GOAT PDF — Day 4 & Day 5 SEO Audit

**Date:** 2026-09-02
**Scope:** Google Search Console discovery foundation (sitemap, robots, indexability) and technical on-page SEO (titles, descriptions, headings, canonicals, Open Graph, internal linking, content, structured data, URL structure) across the homepage and all 8 tool pages.

---

## Search Console readiness

### Sitemap — ✅ implemented correctly, ⚠️ wrong domain in production

`src/app/sitemap.ts` (Next.js's built-in `MetadataRoute.Sitemap` convention, served at `/sitemap.xml`) already existed and is structurally correct: homepage + 4 legal pages + all 8 tool pages, 13 URLs total, zero API/technical/private routes. This was already sound before this audit and needed no structural change.

**Problem found:** every URL in the live sitemap points to `https://goatpdf.app/...` — a placeholder domain, not the real `https://goatpdf.onrender.com` site. This is not a sitemap bug; it's a single, site-wide environment variable (`NEXT_PUBLIC_SITE_URL`) that still isn't set in Render's dashboard (flagged earlier in this project, still unresolved). See "Problems found" below — **this is the single most important blocker for Day 4**, because Search Console requires a sitemap's URLs to be on the same verified host as the property.

### Robots.txt — ✅ correct

`src/app/robots.ts` (Next.js's `MetadataRoute.Robots` convention, served at `/robots.txt`) allows `/` and disallows only `/api/`, and references the sitemap URL. Verified live: the site is not accidentally blocked, and every public page remains crawlable. Same domain caveat as the sitemap applies to the `Sitemap:` line.

### Indexability — ✅ correct

- No `noindex`/`nofollow` robots meta tag anywhere on the homepage or any of the 8 tool pages (confirmed by absence — a missing robots meta tag means indexable by default, which is correct here).
- `/api/*` responses carry `X-Robots-Tag: noindex, nofollow` (verified live), and are also disallowed in `robots.txt` — belt-and-suspenders, intentional, unchanged.
- Canonical tags exist on every page (see Technical SEO below for the domain issue affecting their *value*, not their presence).

---

## Technical SEO

### Metadata (titles & descriptions)

**Problem found:** every tool page's `<title>` and meta description were built directly from `tool.name` / `tool.description` — the same short strings used for the on-page H1 and homepage/footer card text. They were accurate and unique, but generic ("Compress PDF — GOAT PDF") rather than written for actual search intent, and the meta description never mentioned "free."

**Change made:** added two new fields to each tool in `src/lib/tools.ts` — `seoTitle` and `metaDescription` — used only by `buildToolMetadata()` (`src/lib/seo.ts`) for the `<title>`/`<meta name="description">`/Open Graph/Twitter fields. `tool.name`/`tool.description` are untouched, so the H1, navigation, homepage cards, and footer links look exactly the same as before — this only changes what search engines and search-result snippets see.

| Tool | New title (renders as "`<seoTitle>` — GOAT PDF") |
|---|---|
| Compress PDF | Compress PDF Online Free |
| Merge PDF | Merge PDF Files Online Free |
| Split PDF | Split PDF Online Free |
| Rotate PDF | Rotate PDF Pages Online Free |
| Delete PDF Pages | Delete PDF Pages Online Free |
| JPG to PDF | Convert JPG to PDF Online Free |
| PDF to JPG | Convert PDF to JPG Online Free |
| PDF to Word | PDF to Word Converter Online Free |

The site's existing "`%s — GOAT PDF`" separator (em dash) was kept rather than switched to a pipe, to avoid a site-wide branding-format change beyond what this task needs — the substantive SEO value is in the keyword content, not the separator character.

Each new meta description is unique, mentions "free" naturally, accurately describes real functionality, and is written to be clicked (see `tools.ts` for full text) — verified distinct via a new unit test (`tools.test.ts`).

Homepage and the 4 legal pages already had good, unique, accurate titles/descriptions from earlier work — left unchanged.

### H1 structure — ✅ already correct, extended with one new section

Every page has exactly one H1 (`ToolPageLayout.tsx` for tool pages, `LegalPageLayout.tsx` for legal pages, `page.tsx` for the homepage) — verified across all 13 indexable pages, no duplicates. H2 sequence on a tool page is now: **How it works → Common use cases (new) → Frequently asked questions → Related tools**, all logical, non-redundant. No existing structure was changed, only extended.

### Canonical URLs — ✅ code correct, ⚠️ wrong domain in production

`buildPageMetadata()` sets `alternates.canonical` to a site-relative path, resolved against `metadataBase` (`new URL(SITE_URL)`, set once in the root layout) — this is the Next.js-recommended pattern and was already implemented correctly: no query parameters ever become part of a canonical, no duplicate canonicals, no localhost/dev URLs hardcoded anywhere in source. The *value* is wrong in production for the same single reason as the sitemap — `SITE_URL` falls back to the `https://goatpdf.app` placeholder because `NEXT_PUBLIC_SITE_URL` isn't set on Render. No code change needed here; this is purely a deployment configuration gap.

### Open Graph / social metadata — ✅ already correct

`og:title`, `og:description`, `og:url`, `og:type` (`website`), and a real generated 1200×630 `og:image` (`opengraph-image.tsx`, `next/og`) are set for every page via `buildPageMetadata()`, plus a matching Twitter `summary_large_image` card. No new image was created for this task, per instructions — the existing shared image already covers every page. Same domain caveat applies to `og:url`.

### Internal linking — ✅ already correct

- Homepage → all 8 tools, via the `ToolCard` grid (verified live: all 8 `/tools/<slug>` links present).
- Every tool page → 3 curated, genuinely related tools (`relatedSlugs` in `tools.ts`, rendered by `RelatedTools.tsx`), not a positional rotation — e.g. Compress PDF links to Merge, Split, and PDF to Word. Enforced by an existing unit test (exactly 3, valid, non-self, no duplicates).
- Footer → all 8 tools + all 4 legal pages.

No spammy link blocks, no changes needed.

### Tool-page content — ✅ extended two genuinely missing pieces

Existing content per tool page: an intro paragraph (what it does), a "How it works" numbered list (how to use it / how it works), FAQ, and related tools — all already present, genuine, and specific to each tool's real behavior.

**Problem found:** "Supported file formats" and "Common use cases" were the two content types the task asks for that didn't exist anywhere on the page (the accepted file types existed only as internal data — the `accept` MIME string used by the upload input — never shown as visible content).

**Change made:** added `supportedFormats` (one factual line, e.g. "PDF in, PDF out." / "JPG or PNG in, PDF out.") and `useCases` (2–3 concrete, genuine scenarios per tool, e.g. Compress PDF: "Getting a scanned document under an email attachment size limit") to every tool in `tools.ts`, rendered in `ToolPageLayout.tsx` — a small supported-formats line under the intro, and a new "Common use cases" section. No generic filler — every use case ties to functionality that actually exists.

### Structured data — ✅ already valid, one type corrected

`WebSite` (site-wide), `ItemList` (homepage, all 8 tools), and per tool page: `WebApplication` *(see below)*, `BreadcrumbList` (Home → Tool), and `FAQPage` (only emitted when a tool has real FAQ content — `toolFaqStructuredData()` returns `null` rather than an empty block otherwise). No reviews, ratings, fake organization data, or misleading pricing anywhere — the `Offer` block genuinely reflects a free tool (`price: "0"`).

**Change made:** the per-tool block used `@type: "SoftwareApplication"` with `applicationCategory: "BusinessApplication"`. Switched to `@type: "WebApplication"` (schema.org's more specific subtype for a browser-only, nothing-to-install app — a more accurate description of what GOAT PDF's tools actually are) with `applicationCategory: "UtilitiesApplication"` (more accurate than "BusinessApplication" for a PDF utility). Validated for syntax by parsing the live rendered JSON-LD blocks directly — all well-formed, all matching schema.org's expected shape.

### URL structure — ✅ already correct, no changes

Every public URL (`/`, `/tools/<slug>`, `/about`, `/contact`, `/privacy`, `/terms`) is lowercase, kebab-case, descriptive, and stable — no query-string-driven canonical content, no unnecessary parameters. No URL needed to change, so no redirects were required.

### Performance / SEO sanity check — ✅ no new issues found

- No broken internal links found in any page audited.
- `/tools/does-not-exist` correctly returns a real 404 (existing, tested behavior).
- Rendering is already appropriately hybrid: marketing/content pages are statically prerendered (confirmed via the production build output — every page except the 8 processing API routes is `○ Static`), and only the interactive tool widgets themselves are client components, which is necessary for file upload/processing state.
- No large unoptimized assets found; the OG image is generated on demand via `next/og`.
- No layout regressions on mobile — covered by the existing Desktop Chrome + Mobile Chrome Playwright projects, which this change's e2e run also exercised.

---

## Problems found

1. **`NEXT_PUBLIC_SITE_URL` is still not set in Render's production environment.** Every canonical tag, every Open Graph URL, all 13 sitemap URLs, and `robots.txt`'s `Sitemap:` line currently resolve to the placeholder `https://goatpdf.app` instead of the real live domain. This has been flagged twice before in this project and remains unresolved — it is the single blocking issue for Day 4 readiness, because a Search Console property verified for `goatpdf.onrender.com` cannot accept or validate a sitemap whose URLs point to a different, unverified host.
2. Tool page `<title>`/meta descriptions were reused from short, generic on-page copy rather than written for search intent, and never mentioned "free." — *fixed, see above.*
3. `applicationCategory`/`@type` used a more generic schema.org type than was actually available and accurate. — *fixed, see above.*
4. "Supported file formats" and "Common use cases" — two content types the task explicitly asks for — were genuinely absent from every tool page. — *fixed, see above.*

No other problems were found: sitemap structure, robots.txt, indexability, H1 hierarchy, internal linking, structured data validity, and URL structure were all already correct.

## Changes made

- `src/lib/tools.ts` — added `seoTitle`, `metaDescription`, `supportedFormats`, `useCases` fields to every one of the 8 tools; `name`/`description` (on-page UI text) untouched.
- `src/lib/seo.ts` — `buildToolMetadata()` now uses `seoTitle`/`metaDescription` instead of `name`/`description`.
- `src/lib/structuredData.ts` — per-tool JSON-LD now uses `@type: "WebApplication"` and `applicationCategory: "UtilitiesApplication"`.
- `src/components/tools/ToolPageLayout.tsx` — renders the new "Supported formats" line and "Common use cases" section.
- `tests/unit/lib/seo.test.ts`, `tests/unit/lib/structuredData.test.ts` — updated to assert the new, intentional behavior.
- `tests/unit/lib/tools.test.ts` — new coverage asserting every tool has a distinct, non-empty `seoTitle`/`metaDescription` and a real `supportedFormats`/`useCases`.

No file outside `src/lib/tools.ts`, `src/lib/seo.ts`, `src/lib/structuredData.ts`, `src/components/tools/ToolPageLayout.tsx`, and their tests was changed. No PDF processing code, API route, or UI component unrelated to SEO metadata/content was touched.

## Remaining manual actions (Google Search Console)

These cannot be done from code — they require the Search Console UI and your Google account:

1. **First, fix the `NEXT_PUBLIC_SITE_URL` env var in Render** (Environment tab → set it to `https://goatpdf.onrender.com`, or your final custom domain) and confirm the resulting redeploy shows the real domain in `curl https://goatpdf.onrender.com/sitemap.xml`. Do this *before* the steps below — submitting a sitemap with the wrong domain will fail or mislead Search Console.
2. Add and verify the GOAT PDF property in [Google Search Console](https://search.google.com/search-console) (Domain property if you control DNS, or a URL-prefix property for `https://goatpdf.onrender.com` specifically if not).
3. Submit the sitemap: Search Console → Sitemaps → add `sitemap.xml`.
4. Use URL Inspection on a few key URLs (homepage, 2–3 tool pages) to confirm Google can fetch and render them without errors.
5. Request indexing for the homepage and each of the 8 tool pages individually, since this is a new/low-authority property and Google may not crawl them promptly on its own.
6. Re-check URL Inspection after a few days to confirm pages have moved from "Discovered" / "Crawled" to "Indexed."

## Final status

**READY WITH MINOR ISSUES**

Everything code-controllable for Day 4 and Day 5 is now correctly implemented and verified (sitemap, robots.txt, indexability, titles, descriptions, headings, canonicals, Open Graph, internal linking, content depth, structured data, URL structure). The one outstanding issue — `NEXT_PUBLIC_SITE_URL` unset in Render — is a one-line manual configuration fix, not a code defect, but it must be resolved before submitting anything to Search Console, since it currently makes every canonical tag and every sitemap URL point to a domain that isn't the live site. Submitting the sitemap in its current state (still showing `goatpdf.app`) would not be accepted correctly against a `goatpdf.onrender.com` property.

This is **not** a claim that Google indexing is complete or guaranteed — indexing depends on Google's own crawl scheduling and property age, and none of the manual Search Console steps above have been performed as part of this pass.

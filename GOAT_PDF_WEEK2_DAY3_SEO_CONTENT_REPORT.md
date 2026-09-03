# GOAT PDF — Week 2 Day 3: Long-Tail SEO Content Report

## Summary

Created exactly 4 new long-tail SEO guide pages under `/blog/`, each targeting one of the primary keywords assigned for Day 3, each written independently with a distinct voice, and each linking to its designated tool page. No other pages, posts, or routes were created. No PDF processing logic was touched. All tests (unit, lint, typecheck, build, e2e) pass, and a full audit confirms zero em dash (—) characters anywhere in the modified/new user-facing content.

## Pages Created

### 1. `/blog/how-to-compress-a-pdf-for-email`

- **Primary keyword:** compress pdf for email
- **Related keywords covered naturally:** PDF too large to email, Gmail attachment limit, Outlook attachment limit, shrink PDF file size, reduce PDF for email
- **Approximate word count:** ~1,000 words of body prose (across 7 sections) plus a 3-question FAQ block
- **Internal links:** `/tools/compress-pdf` (primary CTA + in-body link), `/tools/split-pdf` (contextual, in the "when splitting is better" section)
- **Metadata:** unique `<title>` ("How to Compress a PDF for Email | GOAT PDF"), unique meta description, canonical URL, Open Graph + Twitter Card via `buildArticleMetadata`
- **Structured data:** `Article`, `BreadcrumbList` (Home > title), `FAQPage` (3 real, visible questions matching the page's own "Quick questions" section)
- **Fact verification:** Gmail's 25 MB and Outlook.com's 25 MB attachment limits were verified directly against Google's own Gmail help documentation and Microsoft's own Outlook.com support documentation (fetched live during this session), not copied from a third-party blog or an assumed/outdated number.

### 2. `/blog/how-to-merge-multiple-pdfs-in-order`

- **Primary keyword:** merge multiple pdf files
- **Related keywords covered naturally:** combine PDFs in order, reorder PDF pages before merging, merge PDF without changing order
- **Approximate word count:** ~720 words of body prose (across 8 sections) plus a 3-question FAQ block
- **Internal links:** `/tools/merge-pdf` (primary CTA + in-body link), `/tools/compress-pdf` (contextual, in the "when to compress after merging" section)
- **Metadata:** unique title, unique meta description, canonical URL, Open Graph + Twitter Card
- **Structured data:** `Article`, `BreadcrumbList`, `FAQPage` (3 questions, including the real "up to 20 files / 200 MB combined" limit pulled from the actual Merge PDF tool config, not invented)

### 3. `/blog/pdf-to-word-formatting-what-to-expect`

- **Primary keyword:** convert pdf to editable word
- **Related keywords covered naturally:** PDF to Word formatting, PDF to Word tables and images, scanned PDF to Word, PDF to Word OCR
- **Approximate word count:** ~870 words of body prose (across 8 sections, including 5 H3 subheadings for Tables/Images/Fonts/Headers-footers/Complex formatting) plus a 3-question FAQ block
- **Internal links:** `/tools/pdf-to-word` (primary CTA + in-body link)
- **Metadata:** unique title, unique meta description, canonical URL, Open Graph + Twitter Card
- **Structured data:** `Article`, `BreadcrumbList`, `FAQPage`
- **Honesty requirement (explicitly verified):** the article and its FAQ state plainly and repeatedly that GOAT PDF's PDF to Word tool has no OCR, that a scanned/image-only PDF will not convert into editable text because there is no text layer to extract, and that conversion fidelity is not guaranteed for complex layouts. No claim of 100% accuracy, perfect formatting preservation, or OCR support appears anywhere in the page. Confirmed via a live grep of the rendered HTML for "does not include OCR" / "does not currently include OCR" (6 matches, expected — 3 in the article body/FAQ source, doubled by Next's hydration payload) and confirmed no occurrence of "100% accura" or a bare "perfect" claim.

### 4. `/blog/rotate-pdf-permanently-vs-viewer-rotation`

- **Primary keyword:** rotate pdf permanently
- **Related keywords covered naturally:** PDF rotation not saving, permanent vs temporary PDF rotation, rotate PDF and save
- **Approximate word count:** ~640 words of body prose (across 7 sections) plus a 3-question FAQ block
- **Internal links:** `/tools/rotate-pdf` (primary CTA + in-body link)
- **Metadata:** unique title, unique meta description, canonical URL, Open Graph + Twitter Card
- **Structured data:** `Article`, `BreadcrumbList`, `FAQPage`

All four word counts above are conservative, JSX-stripped counts of the visible body paragraphs only (they exclude the FAQ block's question/answer text, which adds roughly 80–150 more words per page). None were artificially padded to hit a target; each article stops when the topic is actually covered.

## SEO Implementation

- **Titles:** each page sets its own `<title>` via `title: { absolute: ... }` in `buildArticleMetadata`, bypassing the root layout's title template so no em dash is inherited. Verified live: e.g. `<title>How to Compress a PDF for Email | GOAT PDF</title>`.
- **Meta descriptions:** unique per page, written to match search intent, verified rendering correctly in the live HTML (no double-escaping bugs — see Testing below).
- **Canonical URLs:** `alternates.canonical` set to each page's own path, verified live (e.g. `<link rel="canonical" href="https://goatpdf.app/blog/how-to-compress-a-pdf-for-email"/>`).
- **Indexing:** no `noindex` on any of the 4 pages; robots.txt confirmed live to allow `/blog/` (only `/api/` is disallowed).
- **Open Graph / Twitter:** each page includes `og:title`, `og:description`, `og:url`, and the shared 1200×630 OG image (with a dash-free `alt` string specific to article pages), plus a matching Twitter card — verified live.
- **Sitemap:** `src/app/sitemap.ts` now includes all 4 new URLs at `priority: 0.6`, `changeFrequency: "monthly"` (below the tool pages' 0.9, since these are supporting content, not primary conversion pages). Verified live via `/sitemap.xml`: all 4 URLs present with the correct production hostname (`https://goatpdf.app`), no localhost/test/API URLs anywhere in the sitemap.
- **Structured data:** every page emits real `Article`, `BreadcrumbList`, and `FAQPage` JSON-LD built from the page's own actual visible content — no fabricated ratings, reviews, prices, authors, or organizations. `author`/`publisher` use the real `GOAT PDF` / `SITE_URL` values already used elsewhere in the site's existing structured data, not invented entities.
- **Internal linking:** each article links to its one required primary tool (fixed per the task spec) plus, for two articles, one genuinely relevant secondary tool (Compress→Split, Merge→Compress) — no link spam, no unrelated tools linked.
- **Navigation:** a new unlabeled footer column ("Guides") lists all 4 articles with short, human-readable link text distinct from their full H1s, following the same unlabeled-column convention already used by the site's other footer columns (Tools, Company). Main nav was not touched.

## Content Quality

Each article was written to answer the actual question implied by its keyword, not to hit a word count:

- The compress-for-email article opens with the real, common frustration (a bounced email), verifies real attachment limits from primary sources, explains the actual mechanism of PDF compression (image re-encoding vs. document structure), and ends with a genuinely different problem (splitting) rather than padding the compression topic further.
- The merge-order article is structured as the actual workflow a user follows (prepare → upload → reorder → merge → check → fix mistakes), because that's the natural shape of the task, not a generic listicle format.
- The PDF-to-Word article is deliberately the most technical and the most hedged, because that's the tool with the most real limitations to disclose — it spends real space on OCR and scanned PDFs rather than glossing over them.
- The rotation article is built around correcting a specific, common misconception (viewer rotation vs. permanent rotation), which is what someone searching "rotate pdf permanently" is actually confused about.

Each article uses different sentence rhythm, different section framing, and different levels of technical detail — they were not generated from one shared template with swapped nouns. No generic AI-pattern intros ("In today's digital world..."), no bullet-heavy structure, no filler conclusions, and no exaggerated claims (e.g., compression results are described as "usually," "often," and "can," never guaranteed).

## Technical Changes

- **New:** `src/lib/seo.ts` — added `buildArticleMetadata()` (dash-free metadata builder for article pages, sitting alongside the existing `buildPageMetadata`/`buildToolMetadata`, both left untouched).
- **New:** `src/lib/structuredData.ts` — added `articleStructuredData()`, `articleBreadcrumbStructuredData()`, `genericFaqStructuredData()`, alongside the existing tool-page structured-data builders (untouched).
- **New:** `src/components/blog/ArticleLayout.tsx` — shared `ArticleLayout` (breadcrumb, H1, description, FAQ block, CTA box) and `ArticleSection` (H2 + content wrapper) components, mirroring the existing `LegalPageLayout`/`LegalSection` pattern already used by the legal pages.
- **New:** 4 article pages under `src/app/blog/<slug>/page.tsx`.
- **Modified:** `src/app/sitemap.ts` — added the 4 blog URLs.
- **Modified:** `src/components/layout/Footer.tsx` — added a 4th footer column (Guides) with links to the 4 articles; grid changed from `sm:grid-cols-3` to `sm:grid-cols-4`.
- **Modified:** `tests/e2e/homepage.spec.ts` — the pre-existing "homepage footer links reach every tool page" test used a substring name match (`getByRole("link", { name: tool.name })`), which started matching two elements once the new "Merge PDFs in Order" guide link was added (its accessible name contains "Merge PDF" as a substring). Fixed by adding `exact: true` to that specific assertion so it only matches the intended tool link. No other test behavior changed.
- No changes to any file under `src/lib/pdf/`, `src/lib/processing/`, `src/app/api/`, or any upload/download/temp-file handling.
- No new dependencies added (`package.json` unchanged).

## Testing

All commands run against the actual current code, in this order, with real results:

- `npm run lint` — **pass**, 0 errors, 0 warnings.
- `npm run typecheck` — **pass**, 0 errors.
- `npm run test` (unit, Vitest) — **pass**, 220/220 tests, 26/26 test files.
- `npm run build` (production, Next.js/Turbopack) — **pass**, 32 routes generated, including all 4 new `/blog/*` pages as statically prerendered (`○`) routes alongside the existing static marketing/tool pages.
- `npm run test:e2e` (Playwright) — **pass**, 164/164 tests (2 pre-existing cross-browser skips, unrelated to this change). Includes a full re-run after fixing the footer-link locator collision described above.
- **Live verification against a real `next start` production server** (not just the test suite):
  - All 4 blog routes return HTTP 200.
  - Each page's `<title>`, canonical `<link>`, and Open Graph tags verified directly from the served HTML.
  - Each page has exactly one `<h1>`.
  - `Article`, `BreadcrumbList`, and `FAQPage` JSON-LD verified present and matching the page's real visible content for the Compress-for-email page (spot-checked in full); title/canonical/H1-count/link-count verified for all 4.
  - Confirmed the primary tool link (and the one secondary contextual link, where applicable) is present and resolves to the correct route on every page.
  - Confirmed the previously-discovered `&amp;apos;` double-escaping bug (from an earlier, reverted blanket-replacement fix attempt) is genuinely gone: the served meta description now renders as `Google&#x27;s`/`that&#x27;s` (a real apostrophe, standard HTML-entity-encoded by Next itself), not the broken literal 7-character text `&apos;`.
  - `/sitemap.xml` confirmed to include all 4 new URLs with the correct production hostname, and confirmed to contain no localhost, `/api/`, or test URLs anywhere.
  - `/robots.txt` confirmed live: `Allow: /`, `Disallow: /api/` only — `/blog/` is not blocked.
  - Footer's new "Guides" links confirmed present and correct on the live homepage.

## Em Dash Audit

Every file created or modified today was searched with the ripgrep-based `Grep` tool (shell `grep`'s Unicode handling proved unreliable in this environment and was not used for this check) for the literal em dash character (—, U+2014):

- All 4 new `/blog/*` page files: 0 occurrences.
- `src/components/blog/ArticleLayout.tsx`: 0 occurrences.
- New functions added to `src/lib/seo.ts` (`buildArticleMetadata`) and `src/lib/structuredData.ts` (`articleStructuredData`, `articleBreadcrumbStructuredData`, `genericFaqStructuredData`): 0 occurrences. (The pre-existing, untouched `buildPageMetadata`/`buildToolMetadata`/`OG_IMAGE`/`websiteStructuredData`/etc. in these same files do still contain their original em dashes — correctly out of scope, since this requirement applies to today's new content, not a retroactive rewrite of the entire pre-existing codebase.)
- New lines added to `src/app/sitemap.ts`, `src/components/layout/Footer.tsx`, and `tests/e2e/homepage.spec.ts`: 0 occurrences. (Each file's one pre-existing em dash — a code comment in `sitemap.ts`, the footer's copyright line — was left untouched and verified to be the exact same pre-existing line, not something introduced today.)
- Live-rendered HTML for all 4 article pages was also checked; the only em dashes present anywhere on those pages come from the shared root layout's pre-existing `WebSite` JSON-LD description and the Footer's pre-existing copyright line, both untouched by this work and present on every page site-wide.

**Em dash character (—) occurrences in modified user-facing content: 0.**

## Issues

- Word counts are on the lower end of the requested 800–1500 range for two of the four articles (Merge: ~720, Rotate: ~640, body-only). Both topics were fully covered per the task's required content list; the alternative was padding with restated points, which was avoided per the "never artificially inflate" instruction. If longer copy is wanted later, the natural place to add it is a worked example or a slightly longer "common mistakes" section on those two pages.
- No new automated e2e test was added specifically for the 4 blog pages (the task didn't require one, and the existing test suite's homepage/static-pages/dark-mode tests already exercise the shared Footer/layout code these pages depend on). Live manual verification via `curl` against a real production server was used instead, as described above.
- An unrelated, pre-existing untracked file (`render-support-ticket-draft.md`) was found at the project root during this session's `git status` check. It predates this task's changes, is unrelated to Day 3 SEO content, and was left untouched — not staged, not committed, not deleted.

## Production Status

- **Committed locally:** yes, this phase's changes were committed to the local `main` branch (see the corresponding commit for the exact file list and message).
- **Pushed to remote:** not yet — pushing was not requested and this project's established workflow is to push only on explicit instruction.
- **Deployed:** not yet — no deploy was triggered as part of this task.
- **Live URLs verified:** not against production (`https://goatpdf.app` / the Render deployment) — all verification above was against a local production build (`next build` + `next start`). Production URLs will only be live once this commit is pushed and deployed.

Per the task's explicit instructions, this work stops here: Week 2 Day 4, internationalization, German pages, new tools, and any unrelated improvements were not started. Awaiting review of this report before any further work.

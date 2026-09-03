# GOAT PDF Week 2 Day 2 SEO Report

**Date:** 2026-09-03
**Scope:** the 8 existing tool pages only. No new pages, no new tools, no route changes, no PDF-processing logic touched.

## Summary

A baseline audit (below) found that titles, meta descriptions, canonicals, robots/indexability, Open Graph, structured data, and internal linking were **already correctly implemented** from earlier SEO work this week — nothing was broken and nothing needed fixing in those areas. The genuine, material gap was **content depth and FAQ count**: each tool page had only 2 FAQs (the task calls for 4–6) and no explicit "why trust this tool" content. That's what this pass actually changed: every tool page's FAQ count was expanded to 5, grounded in verified implementation behavior (real preset values, real file limits, real technical constraints — nothing invented), and a new "Why use GOAT PDF?" section was added with 3 genuine, tool-specific differentiators per page. Two tools got a targeted honesty addition the task specifically asked for: Rotate PDF now explicitly explains permanent vs. view-only rotation, and PDF to Word now explicitly states it has no OCR and won't extract text from a scanned image with no text layer.

## Pages Optimized

All 8 pages — titles/meta/canonical/OG/structured data were already correct (unchanged this pass); content and FAQs were expanded.

| Page | Title | H1 | Meta | Canonical | OG | Structured Data | Internal Links |
|---|---|---|---|---|---|---|---|
| `/tools/compress-pdf` | Unchanged (already unique/correct) | Unchanged: "Compress PDF" | Unchanged (already unique/correct) | Unchanged, self-referencing | Unchanged, correct | Unchanged; FAQPage now reflects 5 Q&A | Unchanged (Merge, Split, PDF to Word) |
| `/tools/merge-pdf` | Unchanged | Unchanged: "Merge PDF" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A | Unchanged (Split, Compress, JPG to PDF) |
| `/tools/split-pdf` | Unchanged | Unchanged: "Split PDF" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A | Unchanged (Merge, Delete Pages, Rotate) |
| `/tools/rotate-pdf` | Unchanged | Unchanged: "Rotate PDF" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A, incl. permanent-vs-view FAQ | Unchanged (Delete Pages, Split, Compress) |
| `/tools/delete-pdf-pages` | Unchanged | Unchanged: "Delete PDF Pages" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A | Unchanged (Split, Rotate, Compress) |
| `/tools/jpg-to-pdf` | Unchanged | Unchanged: "JPG to PDF" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A | Unchanged (PDF to JPG, Merge, Compress) |
| `/tools/pdf-to-jpg` | Unchanged | Unchanged: "PDF to JPG" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A, more precise resolution answer | Unchanged (JPG to PDF, Compress, Split) |
| `/tools/pdf-to-word` | Unchanged | Unchanged: "PDF to Word" | Unchanged | Unchanged | Unchanged | FAQPage now 5 Q&A, incl. no-OCR FAQ | Unchanged (Compress, Merge, Split) |

## Keyword Mapping

Per `GOAT_PDF_KEYWORD_MAP.md`, unchanged this pass (already correctly mapped, no cannibalization):

| Tool | Primary | Secondary | Long-tail |
|---|---|---|---|
| Compress PDF | compress pdf | compress pdf online, compress pdf free, reduce pdf size, reduce pdf file size, make pdf smaller | compress pdf to 1mb, compress pdf for email, compress pdf without losing quality |
| Merge PDF | merge pdf | merge pdf online, merge pdf free, combine pdf, combine pdf files | merge multiple pdf files, combine multiple pdfs |
| Split PDF | split pdf | split pdf online, split pdf free, split pdf into pages | split pdf into separate files, extract pages from pdf |
| Rotate PDF | rotate pdf | rotate pdf online, rotate pdf pages | rotate pdf and save, rotate pdf permanently |
| Delete PDF Pages | delete pages from pdf | remove pages from pdf, delete pdf pages, remove pdf pages | remove a page from pdf, delete pages from pdf online |
| JPG to PDF | jpg to pdf | jpg to pdf converter, convert jpg to pdf, image to pdf, images to pdf | jpg images to pdf, photo to pdf |
| PDF to JPG | pdf to jpg | pdf to image, convert pdf to jpg, pdf to jpg converter | pdf pages to jpg |
| PDF to Word | pdf to word | pdf to word converter, convert pdf to word, pdf to docx, pdf to word online/free | convert pdf to editable word |

No separate pages were created for any of these variations — each maps to its single existing tool page, per this document's own anti-cannibalization instruction.

## Content Improvements

- Added a new **"Why use GOAT PDF?"** section (3 bullets per page) to all 8 tool pages, positioned right after the intro/supported-formats block and before "How it works." Each set of 3 is genuinely tool-specific — not identical boilerplate copy-pasted across pages — combining a real privacy/process fact (private processing, automatic deletion — verifiable against the Privacy Policy) with a real functional differentiator specific to that tool.
- **Compress PDF:** FAQ answers now cite the tool's actual three presets by name and behavior, matching the UI exactly.
- **PDF to JPG:** the vague "it depends on the quality level" answer was replaced with an accurate description grounded in the real implementation (`pdfToJpg.ts`'s three named presets, each with a distinct render scale and JPEG quality) — verified by reading the source before writing the copy, not assumed.
- **Rotate PDF:** added the explicit permanent-vs-view-rotation distinction the task specifically requested — confirmed accurate against the real implementation (`rotatePdf.ts` writes rotation into the saved PDF's page objects; this isn't a viewer-only setting).
- **PDF to Word:** added an explicit, honest answer about scanned PDFs — GOAT PDF has no OCR (consistent with this project's own stated non-goals in `CLAUDE.md`), so a PDF with no real text layer won't convert into editable text. No "perfect conversion" or "100% accurate" language exists anywhere on this page (verified — none was added, and none existed before).
- Total content per page grew meaningfully (roughly 2–3x more FAQ content, plus a new section) without hitting an artificial word-count target — some pages are more content-rich than others by nature of what there was genuinely to say, exactly per the task's "quality over length" instruction.
- The actual tool interface (`{children}` in `ToolPageLayout.tsx`) remains rendered directly below the H1/description and above all of this supporting content — unchanged position, still fully above the fold.

## FAQ Improvements

Every tool page went from 2 to 5 FAQs (within the requested 4–6 range). None are keyword-stuffed filler — each answers a real, specific concern grounded in actual behavior:

- A recurring, genuine question added across most tools: "Will this change/does this change my original file?" — answered accurately per tool (all 8 tools always produce a new output file and never modify the uploaded input).
- Tool-specific additions: email attachment size context (Compress), corrupted-file handling (Merge), invalid range validation (Split), the permanent-rotation distinction (Rotate), multi-page-selection confirmation (Delete Pages), page-size options (JPG to PDF), page-proportion behavior (PDF to JPG), and the no-OCR/scanned-PDF limitation (PDF to Word).
- `FAQPage` JSON-LD is generated dynamically from the same `faqs` array rendered on the page (`toolFaqStructuredData()`), so structured data automatically reflects the same 5 questions shown to users — no divergence between what's marked up and what's visible, consistent with Google's structured-data requirements.

## Internal Linking

Unchanged this pass — audited and confirmed already correct: each tool page links to exactly 3 curated, genuinely related tools (not all 8, not positional filler), and the homepage/header nav link to all 8 tools. No new links added, none removed, none pointed at nonexistent routes.

## Technical SEO

- **Canonical:** unchanged, still correct — every tool page self-references its own `/tools/<slug>` URL on the production hostname.
- **Robots/indexability:** unchanged, still correct — no `noindex`/`nofollow` anywhere on the 8 tool pages, no `X-Robots-Tag` on public routes, `/api/*` remains the only restricted route family.
- **Sitemap impact:** none — this pass didn't add, remove, or rename any route, so `sitemap.xml`'s 13 URLs are unaffected.
- **OG:** unchanged, still correct — `og:title`/`og:description`/`og:url`/`og:type` present and accurate on all 8 pages; no new image created, per instructions.
- **Structured data:** `WebApplication`, `BreadcrumbList`, and `FAQPage` all still present and valid; only the `FAQPage` payload changed (5 entries instead of 2), and only because the visible FAQ content itself changed with it — never diverges from what's on the page.

## Validation

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run test` (unit) — **220/220 passing** in isolation, including 2 new/updated assertions: every tool now requires 4–6 genuinely distinct FAQs (enforced by a `Set` uniqueness check), and every tool requires at least 3 non-empty "why use it" reasons. One run showed a transient timeout in `compressPdf.test.ts` while a full `test:e2e` run was executing concurrently in the background (CPU contention between Playwright's browsers and sharp's image compression) — re-running the unit suite in isolation immediately after confirmed 220/220 clean, so this was resource contention on this machine, not a real regression; nothing in this pass touched `compressPdf.ts` or any processing logic.
- `npm run build` — succeeds, all 28 routes generated
- Local production-server spot check: single H1 confirmed on Compress PDF, all 5 new H2 sections present in the correct order ("Why use GOAT PDF?" → "How it works" → "Common use cases" → "Frequently asked questions" → "Related tools"), `FAQPage` JSON-LD confirmed at exactly 5 `Question` entries, the Rotate PDF permanent-rotation sentence and the PDF to Word no-OCR sentence both confirmed present in the real rendered HTML
- Full `npm run test:e2e` — **164 passed, 2 skipped (normal cross-project skips), 0 failed** on the second run — see Problems Found below for the one real issue this surfaced and fixed on the first run.

## Production Verification

Confirmed the current live production site is healthy before these changes go out: all 8 tool pages plus the homepage return `200` on `https://goatpdf.onrender.com` right now. **Today's specific content changes have not been deployed** — they're committed locally only (consistent with this project's workflow: changes are pushed only when explicitly requested), so a post-deployment check of the new content specifically hasn't been done yet and should be a follow-up once this is pushed. Nothing in this change is deploy-environment-sensitive (no env vars, no config, no infrastructure touched — only `src/lib/tools.ts` content, one shared layout component, and one e2e test file), so the local `next build` + `next start` verification above is a reliable proxy for what production will show once deployed.

## Problems Found

**One real issue, found and fixed — not a content defect, a test-fragility issue exposed by the new content.** The existing Compress PDF e2e test asserted `page.getByText("Reduction")` to confirm the compression stats card was visible. That locator was already fragile (a page-wide, non-scoped text search), and it broke once the new Compress PDF FAQ content legitimately used the word "reduction" in a sentence ("...a smaller size reduction..."), creating an ambiguous match between the stats card's `<dt>Reduction</dt>` label and the FAQ answer text. This was **not a functional bug** — Compress PDF worked correctly throughout — but it was a real test regression this pass caused and is responsible for reporting. Fixed by scoping all 5 occurrences of this locator pattern in `tests/e2e/compress-pdf.spec.ts` to `<dt>` elements specifically, which is the correct, durable fix (rather than avoiding the word "reduction" in content, which would have just deferred the same fragility to the next content change). Re-verified clean: 16/16 Compress PDF e2e tests pass on both projects, and the full suite is clean at 164/164 (non-skipped).

No existing title, meta description, canonical, robots directive, Open Graph tag, structured data type, or internal link was found broken or incorrect during the baseline audit.

## Recommendations for Week 2 Day 3

1. Get real Search Console query data (still the single biggest gap from Day 1) to see whether any of the new FAQ content/keyword phrasing actually needs adjusting based on real user queries rather than competitive/intent reasoning alone.
2. Consider a live production re-check of all 8 tool pages after this deploys, purely for extra confidence — not because anything here is expected to behave differently in production versus the local verification already performed.
3. The `GOAT_PDF_KEYWORD_MAP.md`'s 4-page supporting-content roadmap (blog/guide-style pages, not new tool pages) remains unbuilt and unscheduled — worth a decision on whether Week 2 Day 3 should scope that work or continue focusing on the existing 8 pages.

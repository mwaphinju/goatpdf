# GOAT PDF Keyword Map

**Date:** 2026-09-03
**Type:** Research and strategy only — no code, routes, or functionality changed.
**Data honesty rule followed throughout:** no search volume, CPC, keyword difficulty, or traffic numbers are invented anywhere in this document. Every such metric is marked **"Not available / requires keyword research tool."** Where a claim *is* made (e.g. "all major competitors offer X"), it's backed by a real web search performed for this research, not assumed.

---

## Executive Summary

- **Strongest keyword clusters (by competitive ubiquity, i.e. every major competitor targets them):** Compress PDF and Merge PDF. These are the two most universally-contested PDF tool categories — every competitor checked (iLovePDF, Smallpdf, PDF24, Adobe, Sejda, and several smaller players) has a dedicated page for both, in both English and German.
- **Strongest existing GOAT PDF tools for SEO right now:** Compress PDF and PDF to Word — both have the clearest, most specific transactional intent ("compress pdf online," "pdf to word converter") and GOAT PDF's actual implementation genuinely and honestly matches the promise (measured compression with no fake percentage; real LibreOffice conversion, not a third-party API — both already stated plainly in the existing page content).
- **Biggest long-tail opportunity area:** outcome-specific compression queries ("compress pdf for email," "compress pdf to 1mb") and multi-file workflow queries ("merge multiple pdf files," "extract pages from pdf online") — these show clear, specific tool-use intent that a single well-targeted page (not a new page) can already answer.
- **Biggest future-tool opportunity:** Word to PDF / PowerPoint to PDF / Excel to PDF. Every major competitor checked offers all three, and — importantly — GOAT PDF already has the exact underlying capability (LibreOffice headless, currently used one-directionally for PDF→Word) to do the reverse conversions with comparatively low incremental engineering effort. This is a demand-plus-feasibility match, not a guess.
- **Country/language observation:** German-language demand for PDF tools is real and demonstrable — every major competitor (Adobe, Smallpdf, PDF24, FreePDFConvert) maintains dedicated German-language pages for core tools (`PDF komprimieren`, `PDF zusammenfügen`), and PDF24 itself is a German-origin product with strong presence in that market. This is relevant to Austria specifically. No volume data is available to size this opportunity, but the competitive pattern is a real, observable signal.

---

## Data sources used (and their limitations)

| Source | Used? | Notes |
|---|---|---|
| Google Search Console | **Not accessible.** | I have no dashboard/API access to GOAT PDF's Search Console property from this environment. I cannot pull impressions, clicks, queries, countries, average position, or CTR. See "Search Console" section below — this is a real gap, not a soft caveat. |
| Google Trends | **Not accessible.** | No interactive/API access from this environment. |
| Google Keyword Planner | **Not accessible.** | Requires a Google Ads account login; not accessible from this environment. |
| Ahrefs / SEMrush / other paid keyword tools | **Not accessible.** | No account access. Where search results referenced these tools' output, I did not use their numbers — see the executive note above. |
| Google search result observation (via web search) | **Used.** | I ran real searches for each keyword cluster and for competitor tool catalogs, and report only what was actually returned. |
| Competitor site content (via web search) | **Used.** | iLovePDF's actual tool list, PDF24/Smallpdf/Adobe's German-language pages, etc. — real, current results, not assumed. |
| GOAT PDF's own codebase/architecture | **Used.** | I have direct, accurate knowledge of what's actually implemented (`CLAUDE.md`, `src/lib/pdf/*`) and used it to assess implementation difficulty honestly, not speculatively. |

### Search Console: insufficient data, stated plainly

**I could not inspect Search Console because I have no access to it from this environment — not because the site lacks data.** This is an important distinction: it may well have real impressions/clicks/query data by now (the site has been live and submitted to Search Console for several days as of this research), but I have no way to read it. **If you can export or screenshot Search Console's Performance report (Queries, Pages, Countries tabs, last 28 days), I can incorporate real data into a revised version of this document** — that would meaningfully strengthen the Primary Keyword Map's priority ranking below, which currently relies on competitive/intent reasoning rather than actual query data.

---

## Search Intent Framework

Applied consistently across every keyword in this document:

- **Informational** — wants to understand a concept, not use a tool right now (e.g. "what is a pdf").
- **Navigational** — looking for a specific brand/site (e.g. "ilovepdf", "smallpdf").
- **Transactional / tool-use** — wants to *do the task right now* (e.g. "compress pdf online", "merge pdf free"). **This is GOAT PDF's core audience and the primary focus of this map.**
- **Commercial investigation** — comparing options before choosing (e.g. "best pdf compressor", "ilovepdf vs smallpdf").

---

## Primary Keyword Map

Every keyword below is classified by intent and mapped to an **existing production route** — no new pages implied by this table.

| Keyword | Intent | Target Page | Priority | Country | Evidence/Source | Notes |
|---|---|---|---|---|---|---|
| compress pdf | Transactional | `/tools/compress-pdf` | High | US/UK/CA | Every major competitor targets this exact term (web search) | Broadest, highest-competition head term in this cluster |
| compress pdf online | Transactional | `/tools/compress-pdf` | High | US/UK/CA | Competitor pages target this variant explicitly (web search) | Slightly more specific signal ("online" = no install wanted); same page as above, not a separate one |
| compress pdf free | Transactional | `/tools/compress-pdf` | Medium | US/UK/CA | Common competitor page-title pattern | Same page — "free" is already true and stated on the page |
| reduce pdf size | Transactional | `/tools/compress-pdf` | Medium | US/UK/CA | Distinct outcome-focused phrasing, also targeted by competitors | Not available / requires keyword research tool for relative volume vs. "compress pdf" |
| reduce pdf file size | Transactional | `/tools/compress-pdf` | Medium | US/UK/CA | Longer variant of the above | Same page — do not cannibalize |
| make pdf smaller | Transactional | `/tools/compress-pdf` | Low-Medium | US/UK/CA | Plausible colloquial variant | Not available / requires keyword research tool |
| compress pdf to 1mb | Transactional (long-tail) | `/tools/compress-pdf` | Medium | US/UK/CA | Real outcome-specific query pattern seen across competitor FAQ/content sections | See Long-Tail section |
| compress pdf to 500kb | Transactional (long-tail) | `/tools/compress-pdf` | Low-Medium | US/UK/CA | Same pattern, smaller target size | Not available / requires keyword research tool |
| compress pdf for email | Transactional (long-tail) | `/tools/compress-pdf` | Medium | US/UK/CA | Clear real-world motivation (email attachment limits) | Strong candidate — see Long-Tail section |
| merge pdf | Transactional | `/tools/merge-pdf` | High | US/UK/CA | Universal competitor head term | |
| merge pdf online | Transactional | `/tools/merge-pdf` | High | US/UK/CA | Same pattern as compress | |
| merge pdf free | Transactional | `/tools/merge-pdf` | Medium | US/UK/CA | | |
| combine pdf / combine pdf files | Transactional | `/tools/merge-pdf` | Medium-High | US/UK/CA | "Combine" is a common synonym used interchangeably with "merge" by competitors | Map to the same page — do not split |
| merge multiple pdf files | Transactional (long-tail) | `/tools/merge-pdf` | Medium | US/UK/CA | Clear multi-file workflow intent | GOAT PDF's actual UI (add/reorder/merge up to 20 files) directly answers this |
| combine multiple pdfs | Transactional (long-tail) | `/tools/merge-pdf` | Medium | US/UK/CA | Same as above, synonym | Same page |
| join pdf files | Transactional | `/tools/merge-pdf` | Low-Medium | US/UK/CA | Less common synonym, still used by some competitors | Same page |
| split pdf | Transactional | `/tools/split-pdf` | High | US/UK/CA | Universal competitor head term | |
| split pdf online | Transactional | `/tools/split-pdf` | High | US/UK/CA | | |
| split pdf into pages | Transactional | `/tools/split-pdf` | Medium | US/UK/CA | Matches GOAT PDF's "all pages" mode exactly | |
| split pdf into separate files | Transactional (long-tail) | `/tools/split-pdf` | Medium | US/UK/CA | Same as above, phrased differently | Same page |
| extract pages from pdf | Transactional | `/tools/split-pdf` | Medium-High | US/UK/CA | Matches GOAT PDF's "ranges" mode exactly | Strong intent match — GOAT PDF genuinely does this |
| extract pages from pdf online | Transactional (long-tail) | `/tools/split-pdf` | Medium | US/UK/CA | | Same page |
| pdf to word | Transactional | `/tools/pdf-to-word` | High | US/UK/CA | Universal competitor head term | |
| pdf to word converter | Transactional | `/tools/pdf-to-word` | High | US/UK/CA | | |
| convert pdf to word | Transactional | `/tools/pdf-to-word` | High | US/UK/CA | Same intent, different word order | Same page |
| pdf to docx | Transactional | `/tools/pdf-to-word` | Medium | US/UK/CA | Format-specific variant; GOAT PDF's actual output is genuinely `.docx` | |
| convert pdf to editable word | Transactional (long-tail) | `/tools/pdf-to-word` | Medium | US/UK/CA | Directly matches the real, honest value proposition (editable output, not just a viewer) | Strong candidate — see Long-Tail section |
| pdf to word online / pdf to word free | Transactional | `/tools/pdf-to-word` | Medium | US/UK/CA | | Same page |
| jpg to pdf | Transactional | `/tools/jpg-to-pdf` | High | US/UK/CA | Universal competitor head term | |
| jpg to pdf converter / convert jpg to pdf | Transactional | `/tools/jpg-to-pdf` | High | US/UK/CA | | Same page |
| image to pdf / images to pdf | Transactional | `/tools/jpg-to-pdf` | Medium-High | US/UK/CA | Broader phrasing; GOAT PDF also accepts PNG, so this is arguably a *better*-matching primary term than "jpg to pdf" alone | Worth considering in on-page copy, not a new page |
| photo to pdf | Transactional | `/tools/jpg-to-pdf` | Medium | US/UK/CA | Common real-world framing (phone photos of documents) — matches the existing "Common use cases" content already on the page | |
| pdf to jpg | Transactional | `/tools/pdf-to-jpg` | High | US/UK/CA | Universal competitor head term | |
| pdf to image / convert pdf to jpg | Transactional | `/tools/pdf-to-jpg` | High | US/UK/CA | | Same page |
| pdf pages to jpg | Transactional (long-tail) | `/tools/pdf-to-jpg` | Medium | US/UK/CA | Matches GOAT PDF's per-page rasterization exactly | |
| rotate pdf | Transactional | `/tools/rotate-pdf` | Medium-High | US/UK/CA | Common competitor tool, lower overall competition than compress/merge | |
| rotate pdf online / rotate pdf pages | Transactional | `/tools/rotate-pdf` | Medium | US/UK/CA | | Same page |
| rotate pdf and save / rotate pdf permanently | Transactional (long-tail) | `/tools/rotate-pdf` | Medium | US/UK/CA | Real user concern (many PDF viewers only rotate the *view*, not the file) — GOAT PDF genuinely saves a new, permanently-rotated file | Strong candidate — see Long-Tail section |
| delete pages from pdf | Transactional | `/tools/delete-pdf-pages` | Medium | US/UK/CA | | |
| remove pages from pdf | Transactional | `/tools/delete-pdf-pages` | Medium | US/UK/CA | Synonym, equally common | Same page |
| delete pdf pages / remove pdf pages | Transactional | `/tools/delete-pdf-pages` | Medium | US/UK/CA | | Same page |
| remove a page from pdf | Transactional (long-tail) | `/tools/delete-pdf-pages` | Low-Medium | US/UK/CA | Singular-page framing | Same page |
| delete pages from pdf online | Transactional | `/tools/delete-pdf-pages` | Medium | US/UK/CA | | Same page |

For every "Priority" value above without a cited number: **priority is a strategic judgment based on competitive presence and intent-match strength, not a volume ranking — no search volume data was available to rank these against each other precisely.**

---

## Keyword Clusters

### Cluster: Compress PDF
- **Primary:** compress pdf
- **Secondary:** compress pdf online, compress pdf free, reduce pdf size, reduce pdf file size, make pdf smaller
- **Long-tail:** compress pdf to 1mb, compress pdf to 500kb, compress pdf for email

### Cluster: Merge PDF
- **Primary:** merge pdf
- **Secondary:** merge pdf online, merge pdf free, combine pdf, combine pdf files
- **Long-tail:** merge multiple pdf files, combine multiple pdfs, join pdf files, merge pdf documents

### Cluster: Split PDF
- **Primary:** split pdf
- **Secondary:** split pdf online, split pdf free, split pdf into pages
- **Long-tail:** split pdf into separate files, extract pages from pdf, extract pages from pdf online

### Cluster: PDF to Word
- **Primary:** pdf to word
- **Secondary:** pdf to word converter, convert pdf to word, pdf to docx, pdf to word online, pdf to word free
- **Long-tail:** convert pdf to editable word

### Cluster: JPG to PDF
- **Primary:** jpg to pdf
- **Secondary:** jpg to pdf converter, convert jpg to pdf, image to pdf, images to pdf
- **Long-tail:** jpg images to pdf, photo to pdf

### Cluster: PDF to JPG
- **Primary:** pdf to jpg
- **Secondary:** pdf to image, convert pdf to jpg, pdf to jpg converter
- **Long-tail:** pdf pages to jpg

### Cluster: Rotate PDF
- **Primary:** rotate pdf
- **Secondary:** rotate pdf online, rotate pdf pages
- **Long-tail:** rotate pdf and save, rotate pdf permanently

### Cluster: Delete PDF Pages
- **Primary:** delete pages from pdf
- **Secondary:** remove pages from pdf, delete pdf pages, remove pdf pages
- **Long-tail:** remove a page from pdf, delete pages from pdf online

---

## Long-Tail Opportunities

Selected for clear PDF-problem specificity, genuine answerability by GOAT PDF's actual functionality, and sufficient distinctness from each other (not just minor rewordings of the same query).

| Keyword | Intent | Recommended Page | Priority | Evidence |
|---|---|---|---|---|
| compress pdf to 1mb | Transactional | `/tools/compress-pdf` | Medium | Outcome-specific query pattern observed across competitor content; GOAT PDF's honest "measured reduction, never a fake percentage" framing is a genuine differentiator here |
| compress pdf to 500kb | Transactional | `/tools/compress-pdf` | Low-Medium | Same pattern as above, smaller target |
| compress pdf for email | Transactional | `/tools/compress-pdf` | Medium | Clear, common real-world motivation (attachment size limits) |
| reduce pdf size online | Transactional | `/tools/compress-pdf` | Medium | Redundant with "compress pdf online" cluster — map to same page, do not create separate content |
| merge multiple pdf files | Transactional | `/tools/merge-pdf` | Medium | Directly matches GOAT PDF's actual up-to-20-file, reorderable merge UI |
| combine multiple pdfs | Transactional | `/tools/merge-pdf` | Medium | Synonym of above |
| split pdf into separate files | Transactional | `/tools/split-pdf` | Medium | Matches GOAT PDF's "split into individual pages" mode |
| extract pages from pdf | Transactional | `/tools/split-pdf` | Medium-High | Matches GOAT PDF's "ranges" mode precisely; distinct enough intent from "split into pages" to be worth its own content emphasis on the same page |
| extract pages from pdf online | Transactional | `/tools/split-pdf` | Medium | Same as above |
| convert jpg to pdf | Transactional | `/tools/jpg-to-pdf` | Medium-High | Core head term, but distinct content angle from "image to pdf" (broader) is worth covering on the same page |
| convert pdf to editable word | Transactional | `/tools/pdf-to-word` | Medium-High | Directly matches the genuine value proposition — the output really is editable, not a locked preview |
| rotate pdf and save | Transactional | `/tools/rotate-pdf` | Medium | Addresses a real, common point of confusion (many viewers only rotate the *display*) — GOAT PDF genuinely produces a new rotated file |
| rotate pdf permanently | Transactional | `/tools/rotate-pdf` | Medium | Same underlying concern as above, different phrasing |
| remove a page from pdf | Transactional | `/tools/delete-pdf-pages` | Low-Medium | Singular-page framing, real and common |
| photo to pdf | Transactional | `/tools/jpg-to-pdf` | Medium | Matches a genuine, already-documented use case (phone-photographed documents) |
| pdf pages to jpg | Transactional | `/tools/pdf-to-jpg` | Medium | Matches per-page rasterization exactly |
| compress pdf without losing quality | Transactional | `/tools/compress-pdf` | Medium | Not in the original example list, but a natural extension of the cluster with strong intent-match — GOAT PDF's High Quality preset directly answers this |
| pdf to word without losing formatting | Transactional | `/tools/pdf-to-word` | Low-Medium | Natural extension; GOAT PDF is honest that formatting fidelity varies — this is a query where over-promising would be dishonest, so content should manage expectations, not oversell |

**Search volume for every keyword in this table: Not available / requires keyword research tool.** Priority reflects intent-match strength and competitive observation only.

---

## Country Opportunities

### United States
- English only; no localization gap identified. Highest overall competitive density (every competitor checked targets US English terms most heavily).

### United Kingdom
- English only; terminology is essentially identical to US English for this product category ("PDF," "compress," "merge," "convert" are not Americanisms/Britishisms). No evidence of a meaningful UK-specific terminology variant worth targeting separately.
- Minor, low-confidence note: UK English sometimes prefers "organise" over "organize" in general writing, but this wasn't observed as a meaningful factor in actual PDF-tool search results — not worth acting on without real data.

### Canada
- English only for the same reasons as UK. French-Canadian (Quebec) demand is plausible in principle but was **not researched** for this pass — flagged as a real gap, not assumed to be zero. If pursued, it should be evaluated with real French-language search data before any localization work.

### Austria
- **English-only assumption is not safe here — explicitly confirmed.** Real evidence gathered: every major competitor checked (Adobe, Smallpdf, PDF24, FreePDFConvert) maintains dedicated German-language pages for `PDF komprimieren` (compress) and `PDF zusammenfügen` (merge), and PDF24 itself is a German-origin product with strong presence in DACH (Germany/Austria/Switzerland) markets.
- This is a real, observable competitive signal, not invented demand — but **no volume, CTR, or ranking-opportunity data is available** to size the actual opportunity, and Austria alone is a small market (Germany is the much larger German-speaking market, not in the requested priority list). A German-language page should be evaluated on its own merits (translation quality, ongoing maintenance cost) rather than assumed to be automatically worthwhile from this evidence alone.
- **Recommendation:** worth a follow-up research pass specifically on German-language PDF tool demand before committing to localization — this document only confirms the opportunity exists, not its size.

---

## Competitor Findings

Real findings from this research pass — no content copied, only patterns observed.

- **iLovePDF** has by far the broadest tool catalog of any competitor checked: Merge, Split, Compress, Office-to-PDF (Word/PowerPoint/Excel), PDF-to-Word/PowerPoint/Excel (with OCR variants), OCR PDF, PDF↔JPG, page numbering, watermark, rotate, unlock, protect, remove/reorder/organize pages, PDF/A conversion, repair, Web-to-PDF, edit, sign, scan-to-PDF, redact, compare, forms, crop, workflow automation, and even an AI summarizer/translate feature on premium tiers. This is a genuinely comprehensive, all-in-one positioning.
- **Smallpdf, PDF24, Sejda, Adobe Acrobat online** all offer a similar core set (merge/split/compress/convert) with varying depth beyond that — PDF24 in particular claims 20+ tools and has strong German-market presence; Sejda emphasizes more advanced merge options (bookmarks, table of contents, page-size normalization) as a differentiator within merge itself.
- **Common content pattern across all competitors:** a dedicated landing page per tool, each with the tool itself above the fold, a short explanation, and (in most cases) a brief FAQ — structurally similar to what GOAT PDF already does, not something to copy differently.
- **Observed gap GOAT PDF can genuinely exploit:** most competitors' free tiers carry real friction — file-count/size caps, daily-use limits, or watermarks/sign-up walls pushing toward paid plans. GOAT PDF's actual, honest positioning (no accounts, no watermark, no upsell, stated plainly on `/about`) is a real, defensible differentiation if it stays true — this is a content/positioning angle, not a copying risk, and is already reflected in the site's existing copy.
- **Feature depth gap:** GOAT PDF's 8 tools cover a meaningful subset of the "core batch-processing" category but none of iLovePDF's broader catalog (editing, signing, OCR, security, forms). This is expected at this stage and not itself a problem — see Future Tool Opportunities below for which gaps are worth closing first.

---

## Future Tool Opportunities

Ranked using: (1) real evidence of demand — competitor ubiquity, not invented volume; (2) genuine implementation difficulty, assessed against GOAT PDF's actual current architecture (`pdf-lib`, `sharp`, `pdfjs-dist`, and LibreOffice headless — see `CLAUDE.md`); (3) relevance to the existing 8-tool product; (4) plausible monetization potential (qualitative — no revenue figures invented).

| Tool | Demand Evidence | Difficulty | SEO Potential | Monetization Potential | Recommendation |
|---|---|---|---|---|---|
| **Word to PDF** | Universal across every competitor checked (iLovePDF, Smallpdf, PDF24, Adobe, Microsoft) | **Easy-Medium** — LibreOffice headless already integrated for PDF→Word; the reverse direction (`soffice --convert-to pdf`) uses the same engine and is a well-established LibreOffice capability | High | Medium | **Build Soon** |
| **PowerPoint to PDF** | Universal across competitors checked | **Easy-Medium** — same LibreOffice engine, same reasoning as Word to PDF | Medium-High | Medium | **Build Soon** |
| **Excel to PDF** | Universal across competitors checked | **Easy-Medium** — same LibreOffice engine | Medium | Medium | **Build Soon** |
| **PDF to PNG** | Plausible, distinct from "PDF to JPG" (lossless/transparency use cases); not independently verified for demand | **Easy** — `pdfRenderer.ts`'s existing rasterization pipeline already produces raster images via `sharp`, which supports PNG output natively; this is closer to a variant of the existing PDF to JPG tool than a new tool | Medium | Low-Medium | **Consider** |
| **Add page numbers to PDF** | Appeared as a named feature across competitor catalogs (e.g. iLovePDF) | **Easy** — `pdf-lib` can draw text onto existing pages directly; similar engineering shape to the already-shipped Rotate/Delete Pages tools | Medium | Low-Medium | **Consider** |
| **Watermark PDF** | Appeared prominently in "most requested" research (dedicated competitor articles/tools exist) | **Easy** — `pdf-lib` can draw text/images onto pages; same shape as page numbering | Medium | Medium (has real business/branding use cases) | **Consider** |
| **Organize/Reorder PDF pages** | Appeared across competitor catalogs (iLovePDF: "Reorder PDF pages," "Organize PDF pages") | **Easy** — GOAT PDF already has a working, tested reorderable-list UI pattern (`ReorderableFileList.tsx`, used by Merge and JPG to PDF) that could be adapted from files to pages-within-a-PDF | Medium | Low-Medium | **Consider** |
| **Crop PDF** | Appeared in competitor catalogs | **Easy-Medium** — `pdf-lib` supports adjusting a page's crop box directly | Low-Medium | Low | **Consider** |
| **Sign PDF** | Appeared prominently in "most requested" research; real commercial/business use case | **Medium** — no new native dependency needed (`pdf-lib` can place drawn/uploaded signature images and text), but meaningfully more UI complexity (signature capture, placement/positioning) than the batch tools shipped so far | Medium-High | Medium-High (business/legal use cases skew toward willingness to pay) | **Consider** |
| **OCR PDF** | Appeared prominently and repeatedly in "most requested" research across multiple competitors | **Hard** — no OCR capability exists anywhere in the current stack; would need a new, likely heavy dependency (e.g. Tesseract) or a third-party API, and **directly conflicts with CLAUDE.md's existing, explicit non-goal ("No OCR")** | High | Medium-High | **Skip for now** — real demand exists, but this is a deliberate product-scope decision already made; revisit only as an explicit, conscious scope change, not a Week-2 default |
| **Unlock / Remove PDF password** | Appeared in competitor catalogs | **Hard** — `pdf-lib` has limited/no mature encryption-decryption support; would need a different library, plus genuine legal/misuse considerations around removing password protection from files a user may not own | Medium | Low-Medium | **Skip for now** |
| **Full PDF editor** (WYSIWYG text/object editing) | Appeared across "best PDF editor" competitor content | **Hard** — an entirely different product category (interactive canvas-based editing) from GOAT PDF's current batch-processing model; a major scope departure from the "eight tools, done well" positioning already stated on `/about` | High | High | **Skip for now** — biggest potential payoff on this list, but also the biggest scope/architecture commitment; not a Week 2 decision |

---

## Keyword Cannibalization Risks

These keyword groups must **not** get separate pages — each set should stay mapped to the single existing page already named, per the Primary Keyword Map above:

- "compress pdf," "compress pdf online," "compress pdf free," "reduce pdf size," "reduce pdf file size," "make pdf smaller," "reduce pdf size online" → all → `/tools/compress-pdf` only.
- "merge pdf," "combine pdf," "combine pdf files," "merge multiple pdf files," "combine multiple pdfs," "join pdf files," "merge pdf documents" → all → `/tools/merge-pdf` only.
- "split pdf into pages," "split pdf into separate files" → same intent, same page → `/tools/split-pdf` only.
- "jpg to pdf," "image to pdf," "images to pdf," "jpg images to pdf," "photo to pdf" → all → `/tools/jpg-to-pdf` only (this tool already accepts JPG *and* PNG, so "image to pdf" is not a mismatch).
- "pdf to jpg," "pdf to image," "pdf pages to jpg" → all → `/tools/pdf-to-jpg` only.
- "delete pages from pdf," "remove pages from pdf," "delete pdf pages," "remove pdf pages," "remove a page from pdf" → all → `/tools/delete-pdf-pages` only.

**General rule applied throughout this document:** if two keywords would be answered by the same page doing the same thing, they were mapped to that one page rather than treated as a reason to create a new one — consistent with the task's explicit instruction to avoid cannibalization and avoid creating pages for minor keyword variations.

---

## Recommended SEO Page Roadmap

**Not created in this task — research and recommendation only.** These are existing-tool-adjacent content opportunities, not new tools.

### 1. `/tools/compress-pdf` — content expansion (not a new page)
Given Compress PDF's cluster strength, the recommendation here is to make sure the *existing* page's content genuinely covers the long-tail queries above (to 1MB, for email) rather than create separate pages for each — per the task's own anti-cannibalization instruction. If a standalone page is ever considered, the strongest candidate would be a comparison/guide angle, not a duplicate tool page.

### 2–5. Blog/guide-style supporting content (proposed, not built)

| # | Proposed URL | Target keyword | Secondary keywords | Intent | Why it deserves a page | Unique content it should contain |
|---|---|---|---|---|---|---|
| 2 | `/blog/how-to-compress-a-pdf-for-email` | compress pdf for email | reduce pdf size for email, email attachment size limit | Transactional + informational | Answers a specific, common real-world problem (email size limits) that a bare tool page doesn't explain | Actual email-provider attachment limits (Gmail, Outlook), then a clear link to `/tools/compress-pdf` — genuinely useful standalone content, not a thin wrapper |
| 3 | `/blog/how-to-merge-multiple-pdfs-in-order` | merge multiple pdf files | combine pdf files in order, reorder pdfs before merging | Transactional | Explains the specific workflow (ordering files before merging) that GOAT PDF's UI actually supports | Step-by-step with the real reordering UI, plus a note on the 20-file/200MB combined limit (accurate to `CLAUDE.md`) |
| 4 | `/blog/pdf-to-word-formatting-what-to-expect` | convert pdf to editable word | pdf to word formatting issues, pdf to word accuracy | Informational leaning transactional | Directly addresses the honest, already-stated limitation (formatting fidelity varies) — an opportunity to rank for "why did my pdf to word conversion look wrong" style queries with genuinely helpful, non-oversold content | Concrete guidance on what converts well vs. what doesn't (tables, unusual fonts, images) — matches the real LibreOffice-based implementation, no overpromising |
| 5 | `/blog/rotate-pdf-permanently-vs-viewer-rotation` | rotate pdf permanently | rotate pdf and save, pdf rotation not saving | Informational leaning transactional | Addresses genuine user confusion (many PDF viewers only rotate the on-screen view) | Explains the difference clearly, then routes to `/tools/rotate-pdf` for the real fix |

**Why only 4, not the full 5–10 requested range:** the task also explicitly says "prefer fewer high-quality pages over many low-quality pages" and "avoid creating hundreds of thin SEO pages." Given GOAT PDF's current 8-tool scope and the strength of the cannibalization-avoidance rule above, 4 genuinely distinct, well-justified content pieces is a more honest recommendation than padding this list to hit a round number. If Search Console data (once available) reveals additional real query patterns not covered by the existing tool pages or this list, more candidates can be added with actual evidence behind them.

---

## DAY 1 RECOMMENDATION

1. **Which existing GOAT PDF tool should receive the most SEO attention?** Compress PDF — highest competitive ubiquity, clearest transactional intent, and the most long-tail query variety (specific target sizes, email use case) that the existing page can genuinely answer well.
2. **Which 3 tools appear most promising?** Compress PDF, Merge PDF, PDF to Word — in that order. Compress and Merge for competitive/cluster strength; PDF to Word for its especially strong, honest intent-match (genuinely editable output, not a locked preview) and generally higher-value use case (business/document workflows).
3. **Which 5–10 SEO pages should we build first?** None of the 8 existing tool pages need a *new* companion page yet — see the Roadmap above: 4 genuinely justified supporting content pages (not new tool pages), specifically chosen to avoid thin/duplicate content. This is a strategic recommendation, not a data-backed ranking (no volume data was available to rank them against each other).
4. **Which 3–5 future tools should we prioritize?** Word to PDF, PowerPoint to PDF, Excel to PDF (as a group — same underlying engine, similar effort), then Watermark PDF and Add Page Numbers as lower-effort, moderate-value additions once the Office-conversion trio is live.
5. **Which language should we prioritize after English?** German — the only language with real, observed competitive evidence gathered in this research (every major competitor maintains dedicated German pages for core tools). This is a strategic recommendation based on real but limited evidence, not a sized opportunity — a follow-up research pass is recommended before committing engineering/translation time.
6. **Which country appears most promising based on available evidence?** No country-level performance data is available (no Search Console access) to make this claim with real evidence. Strategically, the US is the largest addressable English-speaking market and where every competitor checked concentrates content, so it's the reasonable default — but this is not a data-backed answer.
7. **What should we NOT build yet?** OCR (real demand, but explicitly conflicts with GOAT PDF's stated non-goals — needs a deliberate scope decision, not a default Week 2 action), Unlock/password removal (real legal/misuse concerns plus a genuine library gap), and a full PDF editor (correct long-term opportunity, but a major architecture/scope commitment far beyond a keyword-research decision).
8. **What should Week 2 Day 2 focus on?** Getting real Search Console data into this process — either by gaining direct access or by having actual Performance-report exports provided — since every priority ranking in this document is currently based on competitive observation and intent reasoning rather than GOAT PDF's own real query data. That data would meaningfully sharpen or potentially reorder several of the priorities above.

**Facts vs. recommendations, stated explicitly:** the competitor tool catalogs, German-language competitor page existence, and GOAT PDF's own architecture (LibreOffice already handling PDF↔Word) are verified facts from real research performed for this document. Every priority ranking, page recommendation, and "Build Soon/Consider/Skip" judgment is strategic reasoning built on top of those facts and this project's existing product philosophy (`CLAUDE.md`) — not independently verified market data.

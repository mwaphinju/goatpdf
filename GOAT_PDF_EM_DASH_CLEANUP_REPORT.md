# GOAT PDF: Project-Wide Em Dash Cleanup Report

## Search Results Before Cleanup

A full search of `src/` (`src/app`, `src/components`, `src/lib`) for the literal Unicode em dash (U+2014, `—`) found the character in **54 files**, **210 total line matches**. These spanned:

- Shared SEO/metadata infrastructure: `src/lib/seo.ts` (`buildPageMetadata`'s title separator, `OG_IMAGE.alt`), `src/lib/structuredData.ts` (`websiteStructuredData`'s description, `toolSoftwareApplicationStructuredData`'s name), `src/app/layout.tsx` (site description, default title, title template), `src/app/opengraph-image.tsx` (`alt` text)
- The entire tool content registry, `src/lib/tools.ts`: metaDescriptions, "why use it" bullets, intro paragraphs, howTo steps, and FAQ answers for all 8 tools (roughly 50 user-facing occurrences)
- The footer copyright line (`src/components/layout/Footer.tsx`)
- The homepage tagline and body copy (`src/app/page.tsx`)
- All four legal/info pages: `/privacy` (14 occurrences), `/terms` (5), `/about` (4), `/contact` (2)
- 9 tool UI components: repeated "Network error" messages, compression-preset descriptions, the PDF to Word formatting disclaimer, a page-selector label, an "already well optimized" message, a "can't delete every page" warning
- 6 `lib/` validation/error-message modules: `validate.ts`, `deletePages.ts`, `pageSelection.ts`, `pageRanges.ts`, `processing/errors.ts`, `hooks/usePdfPageCount.ts`
- The remaining matches (roughly half the total) were internal code comments (`//`, `/** */`), never rendered to a user

The four Week 2 Day 3 blog articles (`src/app/blog/*`) and `src/components/blog/ArticleLayout.tsx` were rechecked and confirmed to already contain zero occurrences from the prior pass; no changes were needed there.

## Changes Made

28 source files were edited, replacing every em dash in genuinely user-facing text (JSX text nodes, string literals rendered as content, metadata fields, structured-data string values, error messages) with punctuation appropriate to that specific sentence: comma, period, colon, semicolon, parentheses, or a plain hyphen. No mechanical single-character substitution was used; each sentence was read and repunctuated to sound natural. Examples:

- `"Not directly inside the merged file — but you can run..."` became `"Not directly inside the merged file, but you can run..."`
- `"Rotation is additive — rotating a page..."` became `"Rotation is additive: rotating a page..."`
- `"Remove specific pages from a PDF — a blank cover sheet, a duplicate scan, an outdated section — without touching..."` became `"Remove specific pages from a PDF (a blank cover sheet, a duplicate scan, an outdated section) without touching..."`
- `"Network error — please check your connection and try again."` became `"Network error. Please check your connection and try again."` (identical fix applied across all 8 tool components' shared error-handling pattern)

Files changed: `src/lib/tools.ts`, `src/lib/seo.ts`, `src/lib/structuredData.ts`, `src/app/layout.tsx`, `src/app/opengraph-image.tsx`, `src/app/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/components/layout/Footer.tsx`, `src/components/tools/{CompressPdfTool,DeletePagesTool,JpgToPdfTool,MergePdfTool,PageSelector,PdfToJpgTool,PdfToWordTool,RotatePdfTool,SplitPdfTool}.tsx`, `src/lib/files/validate.ts`, `src/lib/hooks/usePdfPageCount.ts`, `src/lib/pdf/{deletePages,pageRanges,pageSelection}.ts`, `src/lib/processing/errors.ts`.

Code comments were left untouched, per the task's own scoping, except one in `src/lib/tools.ts` that had gone factually stale (it quoted the old `"%s — GOAT PDF"` title template in its own documentation text) and was corrected to match the new template so the comment doesn't mislead a future reader.

## SEO/Metadata Changes

- **`buildPageMetadata`** (`src/lib/seo.ts`): the OpenGraph/Twitter title separator changed from `${title} — ${SITE_NAME}` to `${title} | ${SITE_NAME}`. This affects every page's OG/Twitter title site-wide (all 8 tool pages, all 4 legal pages, the homepage).
- **Root `<title>` template** (`src/app/layout.tsx`): `title.default` changed from `"GOAT PDF — Free PDF Tools That Just Work"` to `"GOAT PDF: Free PDF Tools That Just Work"`; `title.template` changed from `"%s — GOAT PDF"` to `"%s | GOAT PDF"`. This is the actual rendered `<title>` tag on every page that doesn't set its own absolute title (i.e., every page except the 4 blog articles, which already used `|` from the Day 3 pass).
- **Homepage meta description** (`src/app/layout.tsx`'s `DESCRIPTION` constant): em dash replaced with a comma.
- **`OG_IMAGE.alt`** (`src/lib/seo.ts`): `"GOAT PDF — Free PDF Tools That Just Work"` → `"GOAT PDF: Free PDF Tools That Just Work"`. Since `buildArticleMetadata`'s separate `articleOgImage` override existed solely to give article pages a dash-free alt string distinct from the (formerly dash-containing) shared `OG_IMAGE`, that override is now redundant and was removed; `buildArticleMetadata` now reuses `OG_IMAGE` directly. Its stale comment (explaining the now-nonexistent need for a separate image object) was also corrected.
- **`opengraph-image.tsx`'s `alt` export**: same fix, for consistency with `OG_IMAGE.alt`. The actual rendered PNG image text was already dash-free (the two lines of text in the generated image never contained the character).
- **Every tool's `metaDescription`** (`src/lib/tools.ts`, all 8 tools): em dashes replaced, e.g. Compress PDF's `"...preserving quality — no sign-up..."` → `"...preserving quality. No sign-up..."`.

## Structured Data Changes

- **`websiteStructuredData`** (`src/lib/structuredData.ts`): the `WebSite` schema's `description` field had its em dash replaced with a colon (`"...PDF tools: compress, merge, split..."`). This string is emitted in the JSON-LD `<script>` tag on every page (via the root layout) and is also usable by search engines as snippet text.
- **`toolSoftwareApplicationStructuredData`**: the `WebApplication` schema's `name` field changed from `` `${tool.name} — ${SITE_NAME}` `` to `` `${tool.name} | ${SITE_NAME}` ``, matching the site-wide title separator.
- **`toolFaqStructuredData`** and the Day 3 `genericFaqStructuredData`: no code changes needed; both simply echo each tool's/article's own `question`/`answer` strings, which were already fixed at the source (`tools.ts` and the blog article files respectively), so the emitted FAQPage JSON-LD is automatically dash-free.
- No schema types were added, removed, or had their meaning changed; only string values were repunctuated.

## Permanent Prevention

**`CLAUDE.md`** now has a new `## User-facing writing style` section (inserted after `## Coding standards`, before `## Security requirements`) stating the em dash ban as a permanent project rule: forbidden in page copy, metadata, structured data, FAQs, articles, buttons/CTAs, accessibility text, and legal/marketing copy; not applicable to internal code comments; natural alternatives (comma, period, colon, semicolon, parentheses, hyphen) preferred over mechanical substitution; and an instruction to grep modified files for the character before completing any content-related task. No existing instructions were removed or weakened.

**Automated check**: `scripts/check-em-dash.mjs` (new file, no new npm dependency) scans `src/app`, `src/components`, and `src/lib` for `.ts`/`.tsx` files, walks each line tracking whether it's inside a `//` or `/** */` comment, and reports any em dash found outside of comments with the exact file path and line number. The forbidden character is constructed in the script via `String.fromCodePoint(0x2014)` rather than embedded literally, so the script's own source never contains it. It's wired up as `npm run check:em-dash` in `package.json`. It was verified to actually catch a violation (tested against a temporary sample file containing the character in a comment, a JSDoc block, and real code; it correctly flagged only the real-code occurrence and ignored both comment forms) before being confirmed clean against the real codebase.

This is a standalone script, not yet wired into `npm run lint`, `npm run test`, or a CI/pre-commit hook; running it is a manual step for now (documented in `CLAUDE.md`). Wiring it into the lint or test pipeline would be a reasonable follow-up if the user wants it enforced automatically rather than by convention.

## Final Audit

Verified with the `Grep` tool (not shell `grep`, whose Unicode handling has repeatedly proven unreliable in this Windows/Git-Bash environment) and cross-checked with `npm run check:em-dash`:

**User-facing em dash occurrences: 0.**

Everywhere else the character still exists, and why it was intentionally left:

1. **Internal code comments in `src/`**: 85 occurrences across 36 files (`//` line comments and `/** */` JSDoc blocks only). These are never sent to the browser or rendered anywhere; they exist only in the TypeScript/TSX source. Per the task's own instruction 9 and the new CLAUDE.md rule, these were left as-is except the one factually-stale comment corrected above.
2. **`tests/`**: 74 occurrences, all inside Playwright/Vitest `describe(...)`/`test(...)` group labels or test-file code comments (e.g. `describe("compressPdf — text PDFs", ...)`). These are internal test-runner labels shown only in CI/terminal output, never in the application. Two genuine test *assertions* that checked exact user-facing title strings (`tests/unit/lib/seo.test.ts`, expecting `"Terms — GOAT PDF"`) were found and updated to the new `"Terms | GOAT PDF"` value; every other test that referenced changed copy did so via a substring match (e.g. `hasText: "couldn't be read"`) that still passes unchanged.
3. **`CLAUDE.md` and other root-level `.md` files** (`README.md`, `DEPLOYMENT.md`, `MVP_AUDIT.md`, `SECURITY_AUDIT.md`, prior phase reports, etc.): these are internal project documentation, never served to a site visitor, and are explicitly out of this task's "user-facing content" scope. The two em dash characters that do appear inside the *new* CLAUDE.md rule section are both literal, backtick-quoted references to the character itself, naming what's forbidden (e.g. `` `—` ``), not punctuation in prose; they're the same pattern the task's own instructions used when writing the rule (e.g. "Forbidden: `—`"). One pre-existing untracked file, `render-support-ticket-draft.md`, is unrelated prior work from another session and was not touched.
4. **Generated/build output** (`.next/`, fully gitignored, never committed): a handful of `.js` chunk files contain the character, but only as a data value inside a bundled third-party character-encoding table (a CP1252/Windows-1252 byte-to-character map, e.g. byte `0x97` → em dash, part of a PDF-processing library's font-encoding logic), not as GOAT PDF's own authored text. This is expected and unrelated to the cleanup's scope.

The repository does **not** genuinely contain zero occurrences of U+2014 overall, but every remaining one falls into a category (internal comment, test label, project documentation, or third-party library data) that is not user-facing, matching the task's own stated scope.

## Testing

All commands run against the actual current code, with real results:

- `npm run typecheck` — **pass**, 0 errors.
- `npm run lint` — **pass**, 0 errors, 0 warnings.
- `npm run test` (unit, Vitest) — **pass**, 220/220 tests, 26/26 test files (includes the corrected `seo.test.ts` title assertions).
- `npm run build` (production) — **pass**, all 32 routes generated successfully, including the 4 blog pages and all 8 tool pages.
- `npm run test:e2e` (Playwright) — **pass**, 164/164 tests (2 pre-existing cross-browser skips, unrelated to this change).
- `npm run check:em-dash` (new) — **pass**, 0 violations found in `src/app`, `src/components`, `src/lib`.

No test was weakened to make it pass; the one test change (`tests/unit/lib/seo.test.ts`) updated two expected-value strings to match the new, correct dash-free title format.

## Scope Confirmation

- No routes were added, removed, or renamed.
- No PDF processing logic (`src/lib/pdf/*`'s actual compression/merge/split/rotate/delete/convert behavior) was changed; only user-facing error/validation message text in those files was repunctuated.
- No new tools were added.
- No new blog articles were added; the existing 4 were rechecked, not rewritten.
- Week 2 Day 4 was not started. No internationalization, translation, or German-language work was done.
- No infrastructure, deployment configuration, or SEO strategy was changed.
- Nothing was pushed or deployed as part of this cleanup. Changes were committed locally, per this project's standing workflow of committing after each completed unit of work, but pushing was not requested.

Stopping here per the task's instructions.

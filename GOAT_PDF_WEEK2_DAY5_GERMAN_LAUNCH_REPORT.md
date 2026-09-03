# GOAT PDF Week 2 Day 5 German Launch Report

## Summary

Launched exactly 5 real German pages (homepage, Compress PDF, Merge PDF, Split PDF, PDF to Word) at `/de`, `/de/tools/pdf-komprimieren`, `/de/tools/pdf-zusammenfuegen`, `/de/tools/pdf-teilen`, and `/de/tools/pdf-in-word`, reusing the Day 4 i18n architecture and the exact same shared PDF processing backend as the English tools. `"de"` was added to `READY_LOCALES` only after all 5 pages existed, rendered correctly, had complete German UI/metadata/structured data, and the full test suite passed. Every existing English URL is unchanged. Hreflang, canonicals, and sitemap entries are correctly self-consistent and gated so they can never reference a page that doesn't exist. All 4 launched German tools were verified end to end (upload, process, download) against the real, shared processing pipeline, not a mock. One real bug (German structured data pointing at the English URL) was found and fixed during verification. Nothing was pushed or deployed.

The one real architectural decision this phase required: rendering `<html lang="de">` on German pages while keeping `<html lang="en">` on English ones needs two independent Next.js root layouts (Next's "multiple root layouts" route-group pattern), since a single shared layout can only render one `<html>` tag. Every existing English route file moved into a `src/app/(en)/` route group (URLs unchanged, since route groups are invisible in the URL) and `src/app/de/` became a second, independent root. This is covered in full below.

## German Pages Created

| English Page | German Page | HTTP Status |
| --- | --- | --- |
| `/` | `/de` | 200 |
| `/tools/compress-pdf` | `/de/tools/pdf-komprimieren` | 200 |
| `/tools/merge-pdf` | `/de/tools/pdf-zusammenfuegen` | 200 |
| `/tools/split-pdf` | `/de/tools/pdf-teilen` | 200 |
| `/tools/pdf-to-word` | `/de/tools/pdf-in-word` | 200 |

All 5 verified live against a real production build (`next build` + `next start`), not assumed. No other German route exists.

## Translation Scope

Fully translated for the 5 launched pages:

- Page-level SEO content: title, meta description, H1, intro, "Why use GOAT PDF?", "How it works", "Typische Anwendungsfälle" (use cases), FAQs, Open Graph/Twitter metadata, structured data.
- Shared interactive UI: upload prompts and hints, file validation errors (unsupported type, too large), the primary action button, "Start over", processing labels, the generic network-error message, page-count status text, reorder/remove file accessibility labels, download/"process another file" buttons.
- Tool-specific interactive UI: Compress's 3 preset labels/descriptions and result-stats labels; Merge's file-count and reorder text; Split's mode labels, page-range hint, and validation errors; PDF to Word's formatting disclaimer (shown both before and after conversion, honestly stating no OCR).
- Navigation: header (logo, Tools dropdown, "Alle Tools", language selector), mobile menu, footer (tool links, tagline, copyright line), all German-specific.

Deliberately **not** translated today (matching this task's explicit scope):

- The other 4 tools (Rotate PDF, Delete PDF Pages, JPG to PDF, PDF to JPG): no German routes, no German dictionary content beyond the shared UI strings that already exist for architecture reasons.
- The 4 blog guides: no German routes, not in the sitemap.
- Privacy Policy and Terms of Service: remain English-only at their existing `/privacy`/`/terms` routes; the German footer links to them with their real English labels ("Privacy Policy", "Terms of Service") rather than translated labels, so a visitor isn't told they're getting German legal text when they aren't.
- About and Contact pages: same reasoning as legal pages; not part of the 5 launched pages, left English-only, linked from the German footer with English labels.

One known gap, not a scope decision: server-side error messages for a genuinely corrupted/invalid file (from `lib/processing/errors.ts`) are still English even on German pages, since only the client-side validation and UI text were localized. See Issues.

## German Keyword Mapping

| Tool | Route slug | Primary keyword targets addressed in content |
| --- | --- | --- |
| Compress PDF | `pdf-komprimieren` | pdf komprimieren, pdf online komprimieren, pdf datei verkleinern, pdf größe reduzieren, pdf für e-mail verkleinern |
| Merge PDF | `pdf-zusammenfuegen` | pdf zusammenfügen, pdf dateien zusammenfügen, mehrere pdfs zusammenfügen, pdf online zusammenfügen |
| Split PDF | `pdf-teilen` | pdf teilen, pdf seiten trennen, pdf seiten extrahieren, pdf online teilen |
| PDF to Word | `pdf-in-word` | pdf in word umwandeln, pdf zu word, pdf in docx umwandeln, pdf word converter, pdf in bearbeitbares word umwandeln |

Each target appears naturally across the title, meta description, intro, and FAQs of its page, not repeated mechanically; no keyword stuffing (verified by reading each page's final copy, not just checking the target list was "covered"). No file-size guarantee is made anywhere in the Compress PDF copy beyond what the tool actually measures and reports.

## Metadata

Every German page has, verified live: a unique `<title>` (all ending `| GOAT PDF`), a unique meta description distinct from its English counterpart (not reused verbatim), `og:title`/`og:description` matching the page, and `og:locale: de_DE`. Example (Compress PDF): `<title>PDF komprimieren, online und kostenlos | GOAT PDF</title>`, meta description "PDF-Dateien kostenlos online komprimieren. Verkleinere die Dateigröße bei bestmöglicher Qualität. Keine Anmeldung, kein Wasserzeichen, Dateien werden nach der Verarbeitung automatisch gelöscht."

## Canonicals

Every German page self-canonicalizes and never points back to English: `/de` → `https://goatpdf.app/de`, `/de/tools/pdf-komprimieren` → `https://goatpdf.app/de/tools/pdf-komprimieren`, and so on for all 5. Every existing English page's canonical is unchanged. Reverified with the real production hostname (`NEXT_PUBLIC_SITE_URL=https://goatpdf.onrender.com`, see Production Status) that canonicals correctly use that host, not a fallback.

## Hreflang

Implemented via the Day 4 `buildHreflangLanguages` helper, gated on `READY_LOCALES`, verified live for all 5 pairs in both directions. Example, identical on both `/tools/compress-pdf` and `/de/tools/pdf-komprimieren`:

```
<link rel="alternate" hrefLang="en" href="https://goatpdf.app/tools/compress-pdf"/>
<link rel="alternate" hrefLang="de" href="https://goatpdf.app/de/tools/pdf-komprimieren"/>
<link rel="alternate" hrefLang="x-default" href="https://goatpdf.app/tools/compress-pdf"/>
```

Confirmed live that `/tools/rotate-pdf` (not launched in German) emits **zero** hreflang tags, both before and after `"de"` was marked ready for the other 4 pages, proving the gating is genuinely per-page.

## x-default

Always the English URL, for all 5 launched pairs. English is the site's original, broadest-audience version and the one already indexed; German is an explicit `de` alternate, not a replacement for x-default. Verified in the hreflang output above.

## Structured Data

- **WebApplication** (per German tool page): German name/description, `inLanguage: "de"`, `url` self-referencing the German page. A real bug was found here during verification: the first implementation reused the Day 4 English-only helper (`toolSoftwareApplicationStructuredData`), which always derives `url` from the English `/tools/<slug>` path internally regardless of overrides passed in, so the German page's own structured data was claiming to be located at the English URL. Fixed by hand-building the German `WebApplication` object in `GermanToolPageLayout.tsx`; reverified live that `url` now correctly self-references the German page.
- **BreadcrumbList**: "Startseite" (pointing at `/de`, not `/`) > German tool name, hand-built for the same reason (the Day 4 breadcrumb helper hardcodes Home to the English root).
- **FAQPage**: built via the existing, already-generic `genericFaqStructuredData`, fed each German tool's real FAQ content.
- **ItemList** (German homepage): the 4 launched tools, German names, self-referencing German URLs.
- **WebSite** (German root layout): German name/description, `url: .../de`, `inLanguage: "de"`.
- No fabricated ratings, reviews, prices, authors, or statistics anywhere.

## Sitemap

`src/app/sitemap.ts` adds the 5 German URLs via the Day 4 `localizedSitemapEntries()` helper (not a second, hand-built sitemap system), gated on `READY_LOCALES` the same way hreflang is. Verified live before flipping the flag: sitemap had exactly 17 URLs, zero `/de/` entries. Verified live after: **22 total URLs** (17 English, unchanged, plus the 5 launched German pages), every URL using the real site host, none pointing at a nonexistent or 404 route.

## Language Selector

Redesigned to be self-contained: it reads the current path and looks up its counterpart in a new `src/i18n/pageMap.ts`.

- On an English page with a German equivalent (the 5 launched pages), Deutsch is a real link to that exact German page.
- On an English page without one (the other 4 tools, all 4 blog guides, all 4 legal/info pages), Deutsch links to the German homepage (`/de`) rather than being unavailable. This is the explicit UX choice this task asked to be made and documented: a real, useful destination beats a dead control, and telling a German-reading visitor nothing exists in German at all wouldn't be true.
- On a German page, English always links back to the exact English counterpart.
- A locale that genuinely isn't ready still renders disabled with "Coming soon" and is never a link (re-verified via a mocked unit test, since there's currently no such locale to observe live).

## Navigation

`GermanHeader`/`GermanFooter` (new components, not a locale branch inside the English ones) list only the 4 launched German tools, all linking to German routes: Home → `/de`, Compress → `/de/tools/pdf-komprimieren`, Merge → `/de/tools/pdf-zusammenfuegen`, Split → `/de/tools/pdf-teilen`, PDF to Word → `/de/tools/pdf-in-word`. No German page's navigation links back to an English tool route for a translated tool. Verified live and via e2e tests (desktop Tools dropdown, mobile menu).

## Internal Linking

Each German tool page's "Weitere Tools" (related tools) section links only to the other launched German tools, never to English versions or to a nonexistent German route for an untranslated tool (verified: every related-tool link on every German tool page starts with `/de/`). The German homepage's tool grid links only to the 4 launched German tools. The German footer links to `/privacy` and `/terms` with their real English labels, honestly, rather than implying German legal content.

## German UI Translation

Every shared interactive string used by the 4 launched tools was localized: upload drag-and-drop label and hint, "or browse files from your device", file-type/size validation errors, "Start over"/"Try again"/"Download"/"Process another file", processing labels, the generic network-error message, page-count status text ("Diese PDF-Datei hat X Seite(n)."), and reorder/remove accessibility labels. Tool-specific strings (Compress's 3 presets and result-stats labels, Merge's file-count text, Split's mode labels and range hint, PDF to Word's formatting disclaimer) were written per-component. Verified live via `curl` (raw HTML inspection) and via e2e tests asserting the actual rendered German text, not just its absence of English.

## Translation Quality Review

All copy was written directly in German (not machine-translated, not a literal word-for-word pass from the English source), using industry-standard terms where they already exist ("PDF komprimieren", "PDF zusammenfügen", "PDF teilen", "PDF in Word umwandeln", matching this task's own examples) and avoiding region-specific slang, aiming at a professional, simple, neutral register usable across Germany, Austria, and Switzerland. Search-intent keywords were worked into natural sentences, not repeated mechanically (see German Keyword Mapping). Grammar, capitalization (German noun capitalization throughout), and punctuation were checked by re-reading every page's full rendered text live, not just the source. This has **not** had a dedicated native-speaker review pass; see Native Speaker Review Recommendations below for exactly what should still be checked before treating this as fully polished, native-quality copy.

## Accessibility

`<html lang="de">` on all 5 German pages, `<html lang="en">` unchanged on every English page, both verified live. The mobile menu toggle carries German `aria-label`s ("Menü öffnen"/"Menü schließen"). The language selector's accessible structure (summary `aria-label`, `role="group"`, disabled-state `aria-disabled`) is unchanged from Day 4; only its link-resolution logic changed. No change to existing focus order or keyboard operability.

## Dark Mode

German pages reuse the exact same Tailwind utility classes and color tokens as their English counterparts (no new colors or contrast-relevant styles were introduced by any German component), so dark/light mode rendering is structurally identical to the already-verified English pages. Spot-checked live in both modes for all 5 German pages: no unstyled or unreadable content, no layout break from longer German strings (see Mobile below for the specific overflow check).

## Mobile

Verified live and via e2e tests on a mobile viewport (Playwright's Mobile Chrome project): the German mobile menu opens, lists the 4 launched tools with correct German labels and hrefs, and includes the language selector. Longer German labels and button text (e.g. "Maximale Komprimierung", "Weitere Datei bearbeiten") were checked for overflow/clipping on the upload flow, preset radios, and buttons; none observed. No horizontal scrolling introduced.

## Functional Tool Testing

All 4 launched German tools verified end to end against the real, shared processing backend (no mocking, no duplicated processing logic):

- **German Compress PDF**: upload → process → download, confirmed a real, smaller `compressed.pdf` was produced.
- **German Merge PDF**: upload two files → merge → download, confirmed a real `merged.pdf` was produced.
- **German Split PDF**: upload → split into individual pages → download, confirmed a real `split-pages.zip` was produced.
- **German PDF to Word**: upload → convert → download, confirmed a real `.docx` file was produced (via the same LibreOffice-backed conversion the English tool uses).
- **German Compress PDF, corrupted file**: confirmed a clear error is still shown (see Issues: the error text itself is still English, a known, documented gap, not a silent failure).

All 4 tests are real Playwright e2e tests exercising the actual UI and actual API routes, not simulated.

## English Regression

All 24 pre-existing public routes (`/`, all 8 tool pages, all 4 blog guides, `/about`, `/contact`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`) reverified live after the route-group restructuring: all 200, `<html lang="en">` unchanged, canonicals unchanged. The full pre-existing English e2e suite (all 8 tools' upload/process/download flows, dark mode, static pages, homepage, navigation) was re-run and passes unchanged. Two Day 4 tests that specifically asserted "German is disabled" were updated, since that assertion is no longer true by design (see Tests), not because they were wrong to write at the time.

## Em Dash Audit

`npm run check:em-dash`: **0 violations** (scans `src/app`, `src/components`, `src/lib`, `src/i18n`). All new German content (dictionaries, tool content, page/component text) was written without the character from the start; a manual `Grep` sweep of the new test files (not covered by the script) also confirms zero occurrences.

## Tests

- `npm run typecheck` — **pass**, 0 errors.
- `npm run lint` — **pass**, 0 errors, 0 warnings.
- `npm run test` (unit, Vitest) — **pass**, 261/261 tests, 31/31 test files (247 going into today, 14 net new/changed for German).
- `npm run build` (production) — **pass**, 36 routes (31 before Day 5, plus the 5 German pages), all statically prerendered.
- `npm run test:e2e` (Playwright) — **pass**, 205/205 tests, 9 expected cross-project/viewport skips.
- `npm run check:em-dash` — **pass**, 0 violations.

New/updated test coverage: `tests/e2e/german-pages.spec.ts` (routes/locale, no-English-UI-leak checks, 4 functional processing tests, language selector in both directions, navigation/internal-linking, mobile nav), `tests/unit/i18n/pageMap.test.ts`, plus updates to `tests/unit/i18n/{config,dictionary,hreflang,sitemap}.test.ts`, `tests/unit/lib/{seo,sitemap}.test.ts`, `tests/unit/pdf/pageRanges.test.ts`, and `tests/e2e/navigation.spec.ts` to reflect German now being ready (each change reflects a genuine, intended behavior change, not a weakened assertion; see the git diff for exact before/after).

## Issues

- **The true global 404 fallback's Open Graph image resolves against `localhost` instead of the real site.** A side effect of the route-group restructuring needed for `<html lang>` correctness: Next's own internal fallback for a fully unmatched path (e.g. `/tools/does-not-exist`) lost access to `metadataBase` once the true top-level `app/layout.tsx` was split into two root layouts. Affects only this non-indexed, generic fallback, not any real content page, and not the existing e2e test for it (which only checks the 404 status code). A custom `not-found.tsx` was attempted and found to produce worse (invalid nested-`<html>`) output, so it was reverted rather than shipped broken. Low severity, explicitly not hidden.
- **Server-side error messages for corrupted/invalid files are still English on German pages.** Only client-side validation and UI text were localized; the message shown when the server itself rejects a file comes from `lib/processing/errors.ts`, which isn't locale-aware. Fixing this fully means threading a locale field through every tool's upload request and the shared processing/error pipeline used by all 8 tools, which wasn't risked this late in a scoped, small launch. The German e2e test for this case asserts the real (English) behavior rather than a false expectation.
- **Tool-view analytics don't fire on German tool pages.** `AnalyticsPageView`'s path-matching only recognizes `/tools/<slug>`, not `/de/tools/<slug>`; the generic page-view event still fires correctly with the right German path. Minor observability gap, not a functional bug.
- German copy has not had a dedicated native-speaker review pass; see below.

## Native Speaker Review Recommendations

All German content was written deliberately, not machine-translated, with attention to natural phrasing, correct grammar, and standard (non-regional-slang) vocabulary. Before treating it as fully polished, native-quality copy, a native German speaker should review:

- The 4 tool pages' FAQ answers and intro paragraphs, for any phrasing an automated pass can't reliably judge as fully natural.
- `pdf-zusammenfuegen`'s terminology choice ("zusammenfügen" vs. the also-common "zusammenführen") against actual current German search behavior; this was a documented judgment call (see the Day 4 report), not a verified-optimal choice.
- The PDF to Word page's OCR/limitations paragraph specifically, since a false claim there would be a real honesty problem, not just a style one; it currently reads correctly to a fluent-but-non-native review but hasn't had a native pass.

## Production Status

- **Committed**: not yet as of this report; will be committed locally per this project's standing workflow once this report is finalized.
- **Pushed**: no, not requested today.
- **Deployed**: no. Production (`https://goatpdf.onrender.com`) is still running the previously-deployed build (Week 2 Day 4); nothing from today has reached it.
- **Live verified**: yes, against a local production build, including a specific run with `NEXT_PUBLIC_SITE_URL=https://goatpdf.onrender.com` set (the real value already configured in Render) to confirm canonical/hreflang/sitemap/`og:url` all correctly use that real hostname rather than `localhost` or the `goatpdf.app` development fallback. Confirmed for the German homepage, all 5 German URLs in the sitemap, and a German tool page's `og:url`. No claim is made about the live production site reflecting today's work until it's actually deployed.

## Day 6 Recommendation

The architecture and the first 5 German pages are solid and fully validated; Day 6 (or whichever day picks this back up) has two reasonable directions, not mutually exclusive:

1. **Expand German coverage to the remaining 4 tools** (Rotate PDF, Delete PDF Pages, JPG to PDF, PDF to JPG), following the exact same pattern established today: German routes under `src/app/de/tools/...`, German content in `src/i18n/toolContent/de.ts`, a `locale` prop on each tool component with its own small `COPY` object, hreflang/sitemap entries via the same already-gated helpers. No new architecture needed.
2. **Address this phase's documented gaps** before expanding further: get a native-speaker review of the existing 5 pages' copy (see above), and decide whether the server-side error-message localization and German tool-view analytics gaps (see Issues) are worth the shared-code changes they'd require.

Either way, legal-page translation and blog-guide translation remain explicitly out of scope until separately requested, per this task's own instructions.

# GOAT PDF Week 2 Day 4 Internationalization Report

## Summary

Built the internationalization foundation for GOAT PDF: a central locale configuration, a typed translation-dictionary system with safe English fallback, locale-aware (but fully backward-compatible) extensions to the existing metadata and structured-data builders, an hreflang-building helper that can never emit a link to a locale that isn't actually ready, and a compact language selector wired into the header. English remains the only live, fully translated locale. German is configured and provable end to end through tests, but is not exposed as a real route, not in the sitemap, and not linked from anywhere as a working page. Every existing production route, its metadata, and its structured data are unchanged in output for the default (English, no-locale-argument) call path, verified by re-running the full existing test suite plus new tests that assert the old behavior explicitly. No PDF processing, tools, or blog content were touched. Nothing was pushed or deployed.

## Existing Architecture Review

Read `CLAUDE.md`, `GOAT_PDF_KEYWORD_MAP.md`, `GOAT_PDF_WEEK2_DAY2_SEO_REPORT.md`, `GOAT_PDF_WEEK2_DAY3_SEO_CONTENT_REPORT.md`, and `GOAT_PDF_EM_DASH_CLEANUP_REPORT.md`, then inspected the live code (not assumed from the docs):

- **Next.js 16.3.3, App Router.** No `middleware.ts` exists anywhere in the app. Routing is plain file-based: `src/app/tools/<slug>/page.tsx` for the 8 tools, `src/app/blog/<slug>/page.tsx` for the 4 guides, `src/app/{about,contact,privacy,terms}/page.tsx` for legal/info pages, one root `src/app/layout.tsx`.
- **Metadata**: every page builds its `Metadata` export via `buildPageMetadata`/`buildToolMetadata`/`buildArticleMetadata` in `src/lib/seo.ts`, all funneling into one shared title/canonical/OpenGraph/Twitter shape. `SITE_URL` resolves from `NEXT_PUBLIC_SITE_URL`, falling back to a placeholder.
- **Sitemap/robots**: `src/app/sitemap.ts` lists static pages, the 8 tool pages, and the 4 blog pages by hand from `lib/tools.ts` and a literal slug array; `src/app/robots.ts` allows everything except `/api/`, no locale-related blocking exists or is needed.
- **Structured data**: `src/lib/structuredData.ts` exports plain builder functions (`websiteStructuredData`, `toolListStructuredData`, `toolSoftwareApplicationStructuredData`, `toolBreadcrumbStructuredData`, `toolFaqStructuredData`, plus the Day 3 article equivalents), rendered via `<JsonLd data={...} />`.
- **Tool registry**: `src/lib/tools.ts`'s `ToolDefinition[]` is the single source of truth for tool name, slug, SEO title/description, "why use it" bullets, use cases, intro, how-to steps, and FAQs, consumed by the homepage, nav, footer, sitemap, and every tool page.
- **Homepage/blog/legal pages**: all plain server components with hard-coded English JSX text; no existing string-extraction or translation layer of any kind.
- **Header/Footer**: `src/components/layout/Header.tsx` (client component: a `<details>`-based Tools dropdown plus a mobile sheet) and `Footer.tsx` (a 4-column link grid, the 4th added in Week 2 Day 3 for blog guides). Both read tool/link lists from `lib/tools.ts` and a couple of local arrays; no i18n hooks existed.
- **URL/canonical handling**: canonicals are always the bare site-relative path (`alternates: { canonical: path }`); no hreflang, no `x-default`, no locale segment anywhere today.
- **Production hostname**: `SITE_URL` defaults to `https://goatpdf.app` (a placeholder set before the real Render hostname was confirmed); the actual current production URL is `https://goatpdf.onrender.com`, confirmed reachable (200) during this session without pushing anything.

## Internationalization Approach Chosen

A lightweight, dependency-free internal system, not a routing library. Reasoning:

- The app has no `[locale]` dynamic segment and, per this task's explicit constraint, isn't getting one today: existing English URLs must not move, and only one locale (English) is actually ready to publish. A library like `next-intl` earns its keep once there are two or more live locale route trees to manage consistently; introducing it today, before German content exists, would add configuration and a routing-middleware decision with no corresponding benefit yet, and risks exactly the kind of URL disruption Section 3 explicitly forbids.
- What Day 4 actually needs is: a place to declare "these are the locales, this one's default, this one's ready"; a place to store translated strings with a safe fallback; and metadata/structured-data functions that can describe a second locale's page without duplicating logic. All three are small, testable, plain-TypeScript problems.
- The one piece of real routing risk in future German URLs (`/de/tools/pdf-komprimieren`) is a plain static route folder under `src/app/de/tools/pdf-komprimieren/page.tsx`, which Next's file-based routing already handles natively with zero extra configuration; no rewrite/middleware layer is needed to add it later.

## Locale Configuration

`src/i18n/config.ts` is the single source of truth every other i18n module reads from:

- **Default locale**: `en`.
- **Supported locales**: `en`, `de` (`SUPPORTED_LOCALES`).
- **Ready locales**: `en` only (`READY_LOCALES`). This is the actual gate: `isLocaleReady(locale)` and every hreflang/sitemap helper in this app check this list, not `SUPPORTED_LOCALES`, before ever publishing a URL, hreflang link, or sitemap entry for a locale. German moves from "configured" to "live" by adding `"de"` to this one array, once its content is real.
- **Fallback**: handled in the dictionary layer (below), not here: every dictionary lookup falls back to English for any key a locale hasn't defined yet.
- Also defines `LOCALE_NAMES` (display names for the selector) and `LOCALE_OG_MAP` (`en` → `en_US`, `de` → `de_DE`, for Open Graph's `og:locale`).

Adding a third language later means: add it to `SUPPORTED_LOCALES`, give it a display name and OG tag, write its dictionary file, and leave it out of `READY_LOCALES` until its content is done. Nothing else in the app needs to change to "know about" the new locale existing (though it won't publish anything for it until it's marked ready).

## Translation Resource Structure

`src/i18n/`:

- `config.ts` — locale list, default, ready list, names, OG map (above).
- `dictionary.ts` — the `Dictionary` TypeScript interface (the required shape), `PartialDictionary` (what a non-English locale is allowed to supply, i.e. any subset of `Dictionary`), and `getDictionary(locale)`.
- `dictionaries/en.ts` — the complete, authoritative English dictionary.
- `dictionaries/de.ts` — a **partial** German dictionary: Day 4 architecture-proving content only, not a translation.
- `hreflang.ts` — `buildHreflangLanguages()`, described under SEO Strategy below.
- `sitemap.ts` — `localizedSitemapEntries()`, described under Sitemap Strategy below.

**Dictionary categories implemented today** (matching this task's "common UI/navigation/footer/... " list, scoped to shared/global content): `common` (site name, tagline), `navigation` (home, tools, all tools, open/close menu), `footer` (description, section labels), `buttons` (choose file, start over, try again, download, cancel), `upload` (drag-drop label, drop-here), `processing` (processing, please wait), `errors` (network error, invalid file, file too large, processing failed, corrupted file), `success` (download ready), `a11y` (language-selector labels).

**Deliberately not in the dictionary yet**: tool names/descriptions/FAQs, homepage marketing copy, blog articles, and legal page text. These are long-form, SEO-sensitive, or legally-reviewed content where a mechanical key/value swap is the wrong tool: they need real per-string translation review (Day 5+), not a refactor of `lib/tools.ts` and 12 page files today. This is the "document rather than risk a full refactor" choice this task explicitly allows. See "Day 5 German Launch Plan" below for exactly what gets translated first.

**Nothing in the app was rewired to read from the dictionary today.** Every existing component still renders its own hard-coded English JSX text, unchanged. The dictionary system exists, is fully tested, and is ready for Day 5 to start consuming incrementally, tool by tool, rather than as a single sweeping change across every component today (which this task's "do not rewrite the entire project unnecessarily" instruction argues against).

**Fallback mechanics** (`getDictionary`): for each key in the complete English dictionary, use the requested locale's value if it defines one, otherwise use the English value. A key is never left `undefined`, never rendered as an empty string, and never rendered as a raw dotted key like `tools.compress.description` to a real user, because the fallback source (English) is complete by construction: `Dictionary` is a required (non-partial) interface, and `en.ts` is the only dictionary typed against it directly.

## Routing Strategy

**English URL preservation**: no route file under `src/app/{tools,blog,about,contact,privacy,terms}` or `src/app/page.tsx` was touched. All 19 checked production routes (homepage, 8 tools, 4 blog guides, 4 legal pages, sitemap.xml, robots.txt) were re-verified returning 200 against a fresh production build, with unchanged canonical URLs, unchanged sitemap contents (still exactly 17 `<loc>` entries, byte-identical set to before today), and unchanged robots.txt.

**Future German route structure**: plain static routes under `src/app/de/...`, e.g. `src/app/de/page.tsx` (homepage) and `src/app/de/tools/pdf-komprimieren/page.tsx`, using Next's ordinary file-based routing. No rewrites, no middleware, no `[locale]` catch-all segment: `/de/` is just another top-level folder, exactly like `/blog/` is today. This was evaluated against moving the whole English site to `/en/` (mirroring the German prefix) and rejected: it would change every existing, already-indexed English URL for no benefit, which Section 3 explicitly forbids without a compelling documented reason, and none exists here, since prefixed English isn't necessary for a prefixed-German scheme to work (the existing English URLs simply serve as both the default and the `x-default`).

## SEO Strategy

**Canonicals**: unchanged for every English page: `alternates.canonical` is still the bare English path.

**Hreflang**: `src/i18n/hreflang.ts`'s `buildHreflangLanguages(paths, absoluteUrl)` takes a candidate `{ en: "...", de: "..." }` path map and returns a Next `alternates.languages`-shaped object, or `undefined`. It only ever includes a locale that is both present in the given `paths` AND in `READY_LOCALES`. With `READY_LOCALES` currently `["en"]`, calling this function today with any input, including a full `{ en, de }` map, always returns `undefined` (fewer than 2 ready locales to relate), verified by a real unit test. A second unit test mocks `READY_LOCALES` to `["en", "de"]` and confirms the function then correctly emits both locale entries plus `x-default`, proving the mechanism genuinely works, not just that it's inert.

**x-default**: when 2+ locales are ready, `buildHreflangLanguages` points `x-default` at the default locale's (English) URL. Documented choice: English stays x-default permanently, even after German ships, since English is the site's original, broadest-audience version and the one already indexed; German becomes an explicit `de` alternate, not a replacement for x-default.

**Localized metadata**: `buildPageMetadata` (`src/lib/seo.ts`) gained two optional parameters, `locale` (defaults to `DEFAULT_LOCALE`) and `alternateLanguages` (a `{ en, de }` path map, passed straight to `buildHreflangLanguages`). Every current call site (all 8 tool pages via `buildToolMetadata`, the homepage, all 4 legal pages) passes neither, so `locale` resolves to `"en"` (the same `en_US` Open Graph tag as before) and `alternates` stays exactly `{ canonical: path }`, with no `languages` key at all, identical to pre-Day-4 output. This was verified two ways: the pre-existing `seo.test.ts` assertions (which don't pass the new parameters) still pass unchanged, and new tests assert the omission explicitly.

**Localized structured data**: `websiteStructuredData`, `toolSoftwareApplicationStructuredData`, and `articleStructuredData` (`src/lib/structuredData.ts`) each gained an optional `locale` parameter that adds schema.org's `inLanguage` field only when a caller actually passes one. No current call site does, so every page's JSON-LD output is byte-identical to before, verified live against a production build (`grep` for `"inLanguage"` in a rendered tool page's HTML: zero matches) and by new unit tests asserting both the omission and the opt-in addition.

## Sitemap Strategy

`src/app/sitemap.ts` itself was **not modified**: its output was the safest thing to leave completely untouched, and it was reconfirmed live (17 `<loc>` entries, same URLs, same `https://goatpdf.app` host) against a production build.

A new, separate helper, `src/i18n/sitemap.ts`'s `localizedSitemapEntries(paths, options)`, exists for Day 5 to actually wire in: given a `{ en, de }` path map (mirroring `buildHreflangLanguages`'s input shape), it emits one sitemap entry per locale that is both present in the map AND in `READY_LOCALES`. Today, called with any German path, it emits nothing for German and only the English entry (unit-tested), and a mocked-`READY_LOCALES` test proves it correctly emits both once German is marked ready. Day 5's integration step is: change `sitemap.ts` to build its `toolPages`/`blogPages` arrays by mapping each entry through this function instead of a flat English-only array, once real German paths exist to pass in.

## Structured Data Strategy

Covered under SEO Strategy above: `inLanguage` is opt-in on the three schema types where it's a genuine schema.org field (`WebSite`, `WebApplication`, `Article`); it was deliberately not added to `BreadcrumbList`, `FAQPage`, or `ItemList`, since `inLanguage` isn't a meaningful field on those types and adding it would be exactly the "fake schema field" this task warns against. No schema type was added, removed, or had its `@type`/required fields changed.

## Language Selector

`src/components/layout/LanguageSelector.tsx`, a small client component added to both the desktop nav and the mobile nav sheet in `Header.tsx`, styled to match the existing `<details>`-based Tools dropdown. It derives its option list from `SUPPORTED_LOCALES`/`isLocaleReady()`, not a hard-coded list, so it needs no changes when a locale becomes ready:

- **English**: shown as the current locale (marked "Current"), rendered as plain text, not a link (there's nowhere else to navigate to; it's the page already open).
- **Deutsch**: shown, visibly present, `aria-disabled`, labeled "Coming soon", also rendered as plain text rather than a link. Clicking it does nothing and it never navigates anywhere.

Verified live and via e2e tests (desktop and mobile) that: the selector opens, shows both options, shows zero `<a>`/link elements inside it (nothing to click through to a broken page), and that opening the mobile version doesn't navigate away from the current page.

## Accessibility

- `<html lang>` (`src/app/layout.tsx`) now reads from `DEFAULT_LOCALE` instead of a hard-coded `"en"` literal, same rendered value, now sourced from the central config. Verified live: `<html lang="en" ...>` unchanged.
- The selector's trigger has an explicit `aria-label` ("Language: English"); the dropdown panel has `role="group" aria-label="Language"`; the disabled German option carries `aria-disabled="true"` rather than being a focusable, seemingly-functional control.
- No change to existing keyboard navigation, focus order, or the Tools dropdown's own accessibility; the existing WCAG-contrast e2e tests (header nav, light and dark mode) were re-run and pass unchanged.
- A future German page's root would set `lang="de"`; this needs no new mechanism beyond passing the right value to a locale-aware layout, since `<html lang>` is already sourced from config rather than hard-coded per file.

## Missing Translation Handling

`getDictionary(locale)`: any key a locale's dictionary doesn't define resolves to the English value for that same key, never `undefined`, an empty string, or a raw dictionary key. In development (`NODE_ENV !== "production"`), each fallback logs a `console.warn` naming the missing `section.key` and locale, so incomplete coverage is visible to a developer without ever reaching a real visitor (production visitors never see a warning, a broken key, or a runtime error). An `onMissing` override is also accepted directly for tests and tooling to collect the list of missing keys programmatically instead of relying on parsing console output. Verified by unit tests covering: English never reports a fallback (it's the source of truth), German's currently-undefined keys (e.g. `footer.description`) do fall back to the exact English string, and the dev-mode warning actually fires and names the missing key.

## Files Changed

**New:**
- `src/i18n/config.ts`, `src/i18n/dictionary.ts`, `src/i18n/dictionaries/en.ts`, `src/i18n/dictionaries/de.ts`, `src/i18n/hreflang.ts`, `src/i18n/sitemap.ts`
- `src/components/layout/LanguageSelector.tsx`
- `tests/unit/i18n/config.test.ts`, `tests/unit/i18n/dictionary.test.ts`, `tests/unit/i18n/hreflang.test.ts`, `tests/unit/i18n/sitemap.test.ts`
- `GOAT_PDF_WEEK2_DAY4_I18N_REPORT.md` (this file)

**Modified:**
- `src/lib/seo.ts` — `buildPageMetadata` gained optional `locale`/`alternateLanguages` params (backward compatible).
- `src/lib/structuredData.ts` — `websiteStructuredData`, `toolSoftwareApplicationStructuredData`, `articleStructuredData` gained an optional `locale` param (backward compatible).
- `src/app/layout.tsx` — `<html lang>` now sourced from `DEFAULT_LOCALE`.
- `src/components/layout/Header.tsx` — added `LanguageSelector` to desktop and mobile nav.
- `src/components/icons.tsx` — added `GlobeIcon` (hand-written inline SVG, matching the existing icon style; no icon library added).
- `CLAUDE.md` — updated the em dash check's file-list description to include `src/i18n`.
- `scripts/check-em-dash.mjs` — now also scans `src/i18n` (a real gap: dictionary content is user-facing once wired in, and it wasn't covered before this file existed).
- `tests/e2e/navigation.spec.ts` — fixed a locator collision (`header details` now matches both the Tools dropdown and the new language selector; scoped both to their own text) and added 2 new tests for the language selector.
- `tests/unit/lib/seo.test.ts`, `tests/unit/lib/structuredData.test.ts` — added coverage for the new optional locale parameters; no existing assertions were changed or weakened.

No file under `src/lib/pdf/`, `src/lib/processing/`, `src/app/api/`, `src/lib/tools.ts`, any of the 4 blog article pages, or either legal page's content was touched.

## Dependencies Added

No new dependencies added. `package.json`'s `dependencies`/`devDependencies` are unchanged from before this session.

## Tests Added/Changed

- **27 new unit tests** across 4 new files: `tests/unit/i18n/{config,dictionary,hreflang,sitemap}.test.ts`, covering locale config shape, dictionary completeness/fallback/dev-warning behavior, hreflang gating (both the current inert state and, via a mocked config, the working state once a locale is ready), and the equivalent sitemap-entry helper.
- **6 new tests** appended to existing `tests/unit/lib/seo.test.ts` and `tests/unit/lib/structuredData.test.ts`, asserting the new optional parameters are both inert by default and correct when used.
- **2 new e2e tests** in `tests/e2e/navigation.spec.ts` for the language selector (desktop: shows current/coming-soon state with zero links inside it; mobile: opens without navigating away).
- **1 existing e2e test fixed**, not weakened: the Tools-dropdown test's `header details` locator was ambiguous once a second `<details>` existed; it now scopes to `.filter({ hasText: "Tools" })`, restoring a single-match locator while testing the exact same behavior as before.
- No existing test assertion was deleted, loosened, or had its expected value changed to make it pass.

## Validation Results

- `npm run typecheck` — **pass**, 0 errors.
- `npm run lint` — **pass**, 0 errors, 0 warnings.
- `npm run check:em-dash` — **pass**, 0 violations, now scanning `src/app`, `src/components`, `src/lib`, and `src/i18n`.
- `npm run test` (unit, Vitest) — **pass**, 247/247 tests, 30/30 test files (220 pre-existing + 27 new).
- `npm run build` (production) — **pass**, same 32 routes as before Day 4, no new routes added.
- `npm run test:e2e` (Playwright) — **pass**, 166/166 tests (4 pre-existing/expected cross-project skips).

## Regression Check

Verified live against a fresh production build (`next build` + `next start`), not just the test suite:

- All 19 existing public routes checked (`/`, all 8 tool pages, all 4 blog guides, `/about`, `/contact`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`) return HTTP 200.
- `sitemap.xml` still lists exactly the same 17 URLs on the same host, no German entries.
- `robots.txt` unchanged (`Allow: /`, `Disallow: /api/`).
- A live tool page's HTML confirmed: `<html lang="en">`, unchanged canonical, zero `hreflang` attributes, zero `/de/` references anywhere in the page, zero `"inLanguage"` in its structured data, and the language selector rendering "Deutsch"/"Coming soon" (present, clearly not a live option).
- Dark mode, mobile navigation, footer, and tool-page WCAG-contrast e2e tests (`dark-mode.spec.ts`, `static-pages.spec.ts`) all re-ran and passed unchanged.
- The actual production deployment (`https://goatpdf.onrender.com/`) was checked and is currently healthy (200); nothing from today reached it, since nothing was pushed.

## Day 5 German Launch Plan

**Recommended first German content** (as specified): homepage, Compress PDF, Merge PDF, Split PDF, PDF to Word.

**Recommended German routes** (matching the transliteration standard below):

| English | German route | German term chosen | Why |
|---|---|---|---|
| `/` | `/de` | — | Root of the German section, mirrors `/` |
| `/tools/compress-pdf` | `/de/tools/pdf-komprimieren` | "komprimieren" | Standard, high-intent German verb for "compress"; matches established German PDF-tool terminology |
| `/tools/merge-pdf` | `/de/tools/pdf-zusammenfuegen` | "zusammenfügen" (transliterated) | The natural German verb for combining documents into one; "zusammenführen" is a viable alternative but "zusammenfügen" is the more common search term |
| `/tools/split-pdf` | `/de/tools/pdf-teilen` | "teilen" | Direct, natural match for "split"; "trennen" (separate) is a plausible alternative but "teilen" reads more naturally for a document being divided into parts |
| `/tools/pdf-to-word` | `/de/tools/pdf-in-word` | "in Word" | Mirrors the English slug's own "to" → "in" pattern (a conversion target), consistent with how "pdf-to-jpg" would become "pdf-in-jpg" later |

**Transliteration/URL standard to apply consistently for every future German slug**: lowercase, hyphen-separated, ASCII-only; umlauts transliterated as ü→ue, ö→oe, ä→ae, ß→ss (never a literal umlaut or percent-encoded character in a URL); no trailing slash; slug nouns/verbs chosen for actual German search intent, not a literal word-for-word translation of the English slug.

**Required translation resources**: extend `dictionaries/de.ts` to cover the `tools` category (name/shortName only) for these 5 tools first, plus real, reviewed German copy for: the homepage hero/subtitle, each of the 5 tools' on-page description, intro paragraph, "why use it" bullets, how-to steps, and FAQs (2 questions minimum, matching the English pattern). Error/processing/button strings are already covered by today's shared dictionary.

**Hreflang pairing**: for each of the 5 pages, call `buildPageMetadata` with `alternateLanguages: { en: "<english path>", de: "<german path>" }`; once `"de"` is added to `READY_LOCALES`, this automatically starts emitting `en`/`de`/`x-default` hreflang on both the English and German versions of exactly these 5 pages, and no others (every other English page keeps zero hreflang until it, too, gets a German counterpart).

**Sitemap changes needed**: add the 5 German paths to `sitemap.ts` by routing them through `src/i18n/sitemap.ts`'s `localizedSitemapEntries()` instead of hand-writing a second URL list; because that helper gates on `READY_LOCALES`, marking `"de"` ready is what actually makes the German URLs appear, not a separate sitemap edit.

**Metadata changes needed**: German versions of `seoTitle`/`metaDescription` for the 5 pages; pass `locale: "de"` to `buildPageMetadata`/`buildToolMetadata` so `og:locale` becomes `de_DE` and `inLanguage: "de"` can be added to that page's structured data.

**Internal-link changes needed**: the homepage's tool grid and the footer's tool columns need a German-locale version linking to `/de/tools/...` instead of `/tools/...` when rendered under `/de`; the language selector's German option becomes a real link (`href="/de"` or the equivalent localized path for the current page) once `"de"` is in `READY_LOCALES`, replacing today's disabled state, with no other change to the component itself.

**Testing requirements**: unit tests for the 5 German pages' metadata/structured data (mirroring `seo.test.ts`/`structuredData.test.ts`'s existing English assertions); e2e tests confirming each German route loads, uses `lang="de"`, and its hreflang pair resolves to a real, indexable English/German pair in both directions; a sitemap test confirming exactly these 5 URLs (10 total, English + German) appear and no other English page gained an unintended German entry; German-locale WCAG-contrast and mobile-layout checks, since German strings run longer than English and this task's Section 21 specifically flags that risk.

## Production Status

- **Committed**: not yet as of this report; will be committed locally per this project's standing workflow once this report is finalized, matching every prior phase.
- **Pushed**: no, not requested today.
- **Deployed**: no. Production (`https://goatpdf.onrender.com`) was checked and is healthy, running the previously-deployed build; nothing from today's work has reached it.
- **Production verified**: yes, the live homepage was checked (200) as a baseline; all functional verification of today's actual changes was done against a local production build (`next build` + `next start`), per this project's established practice of not treating "the code builds" as proof it works without actually running it.

Per this task's explicit instructions, work stops here: no full translation, no live German pages, no new SEO articles, no new tools, and Week 2 Day 5 was not started.

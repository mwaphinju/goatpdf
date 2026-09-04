# GOAT PDF Mobile Language Selector Fix Report

## Summary

Fixed the mobile language selector's appearance and accessibility. It now shows the current language name, icon, and chevron on one compact row (roughly 48px tall), matching the mobile menu's other rows, in both light and dark mode, at every required viewport width (320-430px). All existing routing behavior (English-to-German-equivalent, English-without-equivalent-falls-back-to-`/de`, German-to-English, disabled-when-not-ready) is unchanged, verified by the existing tests plus new ones. `aria-expanded` was added, correctly reflecting the control's real open/closed state. No other page, route, translation, or piece of desktop navigation was touched.

## Root Cause

`src/components/layout/LanguageSelector.tsx`'s current-language text was:

```jsx
<span className="hidden sm:inline">{LOCALE_NAMES[currentLocale]}</span>
```

`hidden sm:inline` hides the text below Tailwind's `sm` breakpoint (640px) and only shows it at 640px and above. Every required mobile test width (320, 360, 390, 412, 430) is below that breakpoint, so on every real mobile device the language name was always hidden, everywhere it's used, on every mobile page. What remained visible was just the globe icon and the chevron, with no `justify-between` (or any layout rule) to make sensible use of the remaining width, sitting inside a `<details>` element that's a plain block box and therefore already spans the full width of its mobile-menu wrapper by default. The combination (full-width block, two small icons bunched at the left, all the rest of the row visually blank) is exactly the "large mostly-empty full-width section" described.

A secondary, related gap: the control never set `aria-expanded`, since it relied entirely on the native `<details>`/`<summary>` open/closed state with no React state to reflect that state as an ARIA attribute.

## Files Changed

- `src/components/layout/LanguageSelector.tsx` — the fix itself (see Before/After below).
- `tests/e2e/navigation.spec.ts` — 5 new tests in the existing "Mobile Chrome" describe block (English-side coverage of the 6 required test items, plus a desktop regression check folded into the existing test run).
- `tests/e2e/german-pages.spec.ts` — 2 new tests in the existing "German mobile navigation" describe block (German-side coverage: current-language text visible, German-to-English navigation).

No other file was changed. No new page, route, translation, footer label, hreflang entry, sitemap entry, SEO copy, analytics logic, or PDF processing code was touched. Desktop navigation markup is shared with mobile (same component), but its rendered *appearance* is unchanged (see Viewport Results).

## Before/After Behavior

**Before:**
- Mobile (any width below 640px): row shows only a globe icon and a chevron, separated by a large empty gap; no visible language name; looks unfinished.
- No `aria-expanded` on the control at any width.
- Desktop (640px+): language name was already visible (the `sm:inline` breakpoint happens to cover essentially all desktop widths), so desktop was never broken by this bug.

**After:**
- Mobile: one compact row, "🌐 English   ▾" or "🌐 Deutsch   ▾", icon and name grouped on the left, chevron pushed to the right edge via `justify-between` (safe because the wrapping `<details>` is already full-width there), height constrained to 48px via `min-h-12` (reset to `min-h-0` at the `md` breakpoint so it never affects desktop), same left/right padding (`px-3`) nested inside the same outer `px-4` wrapper the other mobile menu rows use.
- Desktop: visually unchanged. `justify-between` has no visible effect there because `<details>` is a flex item that only ever takes its own content width in the desktop nav bar (there's no extra space to distribute), and `min-h-0` at `md:` removes the mobile height floor. Verified directly: the desktop control's bounding box stayed ~116px wide (the same shrink-to-content sizing as before), with the language name still visible.
- `aria-expanded="false"`/`"true"` now correctly reflects the real open state, tracked via a small `useState` synced from the native `<details>` element's own `toggle` event (`onToggle`), not duplicated/faked state.
- All routing behavior is byte-for-byte the same code path as before (`targetPathFor`, `EN_TO_DE_PATH`/`DE_TO_EN_PATH`, `isLocaleReady`); only the JSX layout and the addition of `aria-expanded` changed.

## Viewport Results

Verified with real Playwright/Chromium sessions (not just Tailwind class inspection) at all 5 required widths, in both light and dark mode, on both the English homepage and (at a representative width) the German homepage:

| Width | Text visible | Height in range (44-60px, target 48-56px) | No horizontal overflow | Chevron aligned right | Single control (no duplicate) |
| --- | --- | --- | --- | --- | --- |
| 320px | Pass | Pass (48px) | Pass | Pass | Pass |
| 360px | Pass | Pass (48px) | Pass | Pass | Pass |
| 390px | Pass | Pass (48px) | Pass | Pass | Pass |
| 412px | Pass | Pass (48px) | Pass | Pass | Pass |
| 430px | Pass | Pass (48px) | Pass | Pass | Pass |

All 5 widths also passed in dark mode specifically (same table, repeated with `colorScheme: "dark"`): text visible, correct height, no overflow, chevron aligned, single control.

Additional real-browser checks, all passing:
- `aria-expanded` correctly toggles `false` → `true` on open, at every width.
- Opening the selector shows both "English" and "Deutsch", with the current one marked "Current".
- English tool page → mobile language selector → Deutsch lands on the exact German counterpart (`/tools/compress-pdf` → `/de/tools/pdf-komprimieren`), with `<html lang="de">` confirmed after navigation.
- German tool page → mobile language selector → English lands on the exact English counterpart (`/de/tools/pdf-teilen` → `/tools/split-pdf`), with `<html lang="en">` confirmed after navigation.
- The mobile menu is closed after navigation (a fresh page load, as expected for a real `<Link>` navigation).
- Desktop (1280px): control stays compact (~116px), language text still visible, unaffected by the fix.

These checks were run live against a real production build (`next build` + `next start`) using a temporary, one-off script, not committed to the repository (removed after use); the same behaviors are additionally covered by the permanent Playwright tests listed below, which are part of this change.

## Tests Added/Updated

`tests/e2e/navigation.spec.ts` ("Mobile Chrome" describe block), 5 new tests:
1. "the mobile language selector shows the current language name, not just an icon" — item 1.
2. "the mobile language selector opens to show both languages, with English marked current" — item 2.
3. "the mobile language selector navigates from an English tool page to its exact German counterpart" — item 3.
4. "the mobile menu with the language selector open causes no horizontal overflow" — item 5.
5. "the mobile menu renders exactly one language control, not a duplicate" — item 6.

`tests/e2e/german-pages.spec.ts` ("German mobile navigation" describe block), 2 new tests:
6. "the mobile language selector shows Deutsch as the current language, not just an icon" — item 1, German side.
7. "the mobile language selector navigates from a German tool page back to its exact English counterpart" — item 4.

All 6 required coverage items (current language visible, selector opens, English-to-German navigation, German-to-English navigation, no horizontal overflow, no double rendering) are covered by real, permanent Playwright tests, on real mobile viewports (the project's existing "Mobile Chrome" Playwright project), not just the temporary manual verification script above.

## Regression Check

- Existing desktop language-selector tests (`navigation.spec.ts`'s "Desktop Chrome" block, `german-pages.spec.ts`'s desktop-only "Language selector" block) unchanged and still passing.
- Existing English/German routing, hreflang, sitemap, structured data, and all 8 tools' upload/process/download flows: untouched by this change and unaffected (this fix only touched `LanguageSelector.tsx`'s JSX/classes plus test files).
- No regression found in any test.

## Test Totals

- `npm run typecheck` — **pass**, 0 errors.
- `npm run lint` — **pass**, 0 errors, 0 warnings.
- `npm run check:em-dash` — **pass**, 0 violations.
- `npm run test` (unit) — **pass**, 267/267 tests, 32/32 test files (unchanged from before this fix; this was a UI-only change with no unit-testable logic beyond what's already covered).
- `npm run build` — **pass**, 36 routes, all statically prerendered, unchanged route list.
- `npm run test:e2e` — **pass**, 214/214 tests passed, 16 expected cross-project skips (desktop-only/mobile-only tests correctly not running on the other Playwright project), 0 failed.

## Em Dash Result

`npm run check:em-dash`: **0 violations.** All 3 changed files were also manually checked with the `Grep` tool for the literal `—` character: zero occurrences in `LanguageSelector.tsx`, `navigation.spec.ts`, and `german-pages.spec.ts`.

## Any Regression Found

None.

## Production Status

Not pushed, not deployed, per instructions. Changes exist only in the local working tree at the time of this report; they will be committed and reported as a discrete, reviewable change.

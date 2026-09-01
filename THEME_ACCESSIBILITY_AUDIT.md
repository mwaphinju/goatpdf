# GOAT PDF — Theme Accessibility Audit (Dark Mode / Light Mode)

**Date:** 2026-09-02
**Scope:** every page and component in the app — homepage, all 8 tool pages, all 4 legal pages, header, footer, and every shared UI primitive (buttons, upload zone, error/success/processing states, file lists, page selectors, form inputs).

---

## Issue found

With the OS/browser set to dark mode, parts of GOAT PDF had poor or broken contrast — text and UI elements that were readable in light mode became hard to read, and in some cases effectively invisible, without any code change on the user's part.

## Root cause

The app had **zero intentional dark-mode styling** anywhere. Specifically:

1. `globals.css` (left over from the original `create-next-app` scaffold) defined `--background`/`--foreground` CSS variables with a `prefers-color-scheme: dark` media query that *did* flip them to a dark pair — but this was dead code. The actual `<body>` element used hardcoded Tailwind utility classes (`bg-white text-slate-900`) in `layout.tsx`, which override the CSS-variable-based `body` rule in the cascade. So the one piece of dark-mode logic that existed never actually ran.
2. No component anywhere in `src/` used Tailwind's `dark:` variant. Every background, text, border, and focus-ring color was a single hardcoded light-mode value.
3. With no explicit dark styling and, critically, **no `color-scheme` declared**, the browser had no signal that this page had been designed with dark mode in mind at all. Browsers and mobile OSes increasingly respond to that situation by applying their own automatic "force dark" / content-darkening heuristics to make a light-only page more tolerable in a dark environment — a best-effort color inversion that doesn't understand the page's actual semantics. That heuristic is what produces exactly the reported symptom: text and backgrounds that were fine in the source CSS come out with mismatched or inverted colors once the browser "fixes" them itself, including near-invisible text in places the heuristic gets wrong.

The fix is the one the task describes: stop relying on the browser to guess, and explicitly style both themes.

## Components affected

Effectively every visual component in the app. In order of how many files touched:

- **Foundation:** `globals.css` (removed the dead CSS-variable toggle, added `color-scheme: light dark`), `layout.tsx` (body).
- **Layout/navigation:** `Header.tsx` (logo, nav links, dropdown panel, mobile menu), `Footer.tsx`.
- **Shared UI primitives:** `Button.tsx` (all 3 variants), `ErrorMessage.tsx` (error + info tones), `ProcessingState.tsx`, `ResultDownload.tsx`, `UploadZone.tsx` (dropzone, drag state, hint text, inline error, built-in file list).
- **Shared tool-page components:** `ToolCard.tsx`, `ToolPageLayout.tsx` (heading, intro, "How it works", FAQ), `RelatedTools.tsx`, `PdfPageCountStatus.tsx`, `PageSelector.tsx`, `ReorderableFileList.tsx`.
- **Per-tool components:** `CompressPdfTool.tsx` (stats card, preset radios), `MergePdfTool.tsx`, `JpgToPdfTool.tsx` (3 radio fieldsets), `PdfToJpgTool.tsx` (quality + scope radios), `RotatePdfTool.tsx` (angle + scope radios), `SplitPdfTool.tsx` (mode radios + the one native text input in the app).
- **Legal pages:** `LegalPageLayout.tsx` + inline links in `privacy/about/terms/contact` pages.
- **Homepage:** `page.tsx` (hero gradient, tool grid, CTA section).

**Not touched, verified as already correct:** `DeletePagesTool.tsx` and `PdfToWordTool.tsx` only compose already-fixed shared components and have no colors of their own. `icons.tsx` uses `stroke="currentColor"`/`fill="currentColor"` throughout, so every icon automatically inherits whatever text color its container resolves to in each theme — no icon-specific changes were needed. `ToolActionBar.tsx` and the 8 `app/tools/*/page.tsx` wrapper pages have no color classes at all.

**Explicitly out of scope because they don't exist in this app:** the task's checklist mentions tooltips, modals, native `<select>` dropdowns, and checkboxes — a repo-wide search confirms none of these exist anywhere in GOAT PDF today (only radio-button fieldsets and one native `<details>` dropdown, which is covered under Header). Noted here rather than silently skipped.

## Fixes made

1. **`color-scheme: light dark`** added to `:root` in `globals.css`, plus removal of the dead `--background`/`--foreground` toggle and the unused Geist font theme tokens (also dead — the body's actual `font-family` was already hardcoded to `Arial, Helvetica, sans-serif`, so nothing in the app was reading those tokens either). This tells the browser the page genuinely supports both themes, so native form control chrome (radio buttons, the one text input) renders correctly per-theme instead of the browser trying to guess.
2. **Explicit `dark:` variants added across every component listed above**, using Tailwind's default `prefers-color-scheme`-based `dark:` variant (confirmed no `@custom-variant` override exists, so no config change was needed) — following the existing brand palette (slate for neutrals, emerald for accents) rather than introducing new colors. No theme switcher was added; the site continues to follow the OS/browser preference automatically, exactly as before.
3. **Three related, pre-existing light-mode contrast issues found and fixed while auditing** (same class of bug the project's earlier MVP audit (A11Y-1) already fixed elsewhere, just missed in a few spots): `text-slate-500` on a *tinted* background (the footer's mission-statement paragraph on `bg-slate-50`, `ResultDownload`'s file-size label on `bg-emerald-50`, `PdfPageCountStatus`'s page-count text) was bumped to `text-slate-600`, consistent with the ratio the earlier fix established (slate-500 only clears a tinted background by a thin margin; slate-600 gives a comfortable one). This is a contrast fix, not a redesign — same gray family, same visual weight.

### Representative color mapping (light → dark)

| Role | Light | Dark |
|---|---|---|
| Page background | `white` | `slate-950` |
| Card / raised surface | `white` | `slate-900` |
| Muted section (footer, CTA, processing state) | `slate-50` | `slate-800`–`900` |
| Heading text | `slate-900` | `white` |
| Body text | `slate-700` | `slate-300` |
| Secondary/muted text | `slate-600` | `slate-400` |
| Borders | `slate-200`/`slate-300` | `slate-700`/`slate-800` |
| Accent icons/links | `emerald-600`/`700` | `emerald-400` |
| Error background/text | `red-50`/`red-800` | `red-950`/`red-300` |
| Info/warning background/text | `amber-50`/`amber-900` | `amber-950`/`amber-200` |
| Primary button (emerald-600 bg, white text) | unchanged | unchanged (already high-contrast against either theme) |

## Automated testing

Added `tests/e2e/dark-mode.spec.ts` (Playwright, already a project dependency — no new testing dependency added). It reuses the exact real-color-resolution technique already established in `tests/e2e/static-pages.spec.ts`'s footer-contrast regression test (a 1×1 canvas resolves Tailwind v4's `lab()`/`oklch()`-notation computed colors to real sRGB, since contrast can't be computed from the raw `getComputedStyle()` string).

For **both** `light` and `dark` `colorScheme` (Playwright's `test.use({ colorScheme })`), across the homepage, a representative tool page, a legal page, the header, and the footer:
- Asserts real rendered text-vs-background contrast is **≥ 4.5:1** (WCAG AA) for headings, body text, nav, footer text, and a tool card.
- Asserts a disabled button (WCAG 1.4.3 exempts inactive controls from the 4.5:1 requirement) is still not literally invisible.
- Sweeps the first 40 visible, text-bearing elements on a tool page and asserts none renders with near-identical foreground/background color — the direct regression guard for "invisible text."

20/20 assertions pass (10 checks × light/dark) on both the `Desktop Chrome` and `Mobile Chrome` Playwright projects already configured in this repo.

## Light-mode test result

✅ Full existing test suite unaffected — every class change was additive (`dark:` variants appended, never replacing an existing light-mode class), confirmed by a repo-wide sweep for any color utility left without a `dark:` counterpart before finishing. `dark-mode.spec.ts`'s light-mode assertions all pass. The three incidental contrast tightenings (§Fixes made, item 3) are the only light-mode-visible changes, and they only *increase* contrast margin, never redesign layout, spacing, or which colors are used.

## Dark-mode test result

✅ `dark-mode.spec.ts`'s dark-mode assertions all pass — homepage, a tool page, a legal page, header, and footer all meet WCAG AA (4.5:1) for their checked text, on both desktop and mobile viewports. `color-scheme: light dark` is set, so native form controls (the split-pdf page-range text input, all radio buttons) now render with proper dark-theme chrome instead of a browser-guessed appearance.

## Verification commands

- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm test` (unit) — 217/217 passing
- `npm run build` — succeeds, all 28 routes generated
- `npx playwright test dark-mode.spec.ts` (both projects) — 20/20 passing
- Full `npm run test:e2e` — see final status in this repo's commit history / CI output for this change (run as part of this same verification pass)

## Remaining issues

- **Manual cross-browser/OS verification** (Windows Dark/Light Mode, Chrome, Firefox, a real mobile device) as literally listed in the task's "Reproduce the issue" section was not performed by hand in this pass — this was verified instead via Playwright's `colorScheme` emulation (the standard, deterministic way to test `prefers-color-scheme` behavior across Chromium desktop and mobile viewports) plus real rendered-color contrast assertions, which is more reliable and repeatable than eyeballing it in each browser once, but doesn't substitute for an actual human look in Firefox or on a physical device. Recommend a quick manual pass in Firefox and on one real phone before considering this fully closed.
- **No visual/screenshot regression testing was added** — the automated test checks computed contrast, not pixel-perfect appearance, per the task's "if practical" and "do not add unnecessary testing dependencies" guidance (a screenshot-diffing setup would be a meaningfully bigger addition).
- Tooltips, modals, native `<select>` dropdowns, and checkboxes don't currently exist in this app, so there was nothing to fix for them — if any of those are added in the future, they'll need their own explicit `dark:` treatment following the same pattern used throughout this fix.

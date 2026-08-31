# GOAT PDF — MVP Final Audit

**Auditor role:** Senior QA engineer / security reviewer
**Date:** August 31, 2026
**Commit audited:** `b395735` (Phase 12 — privacy-conscious analytics)
**Scope:** All 8 MVP tools, full site. No fixes implemented — findings only, per instruction.

**Method:** Full automated suite (lint, typecheck, unit, e2e, build, `npm audit`) run to completion, plus live manual/exploratory testing against a real `next build && next start` instance on `localhost:3200` — path traversal attempts, race conditions, slow-network simulation, oversized uploads, concurrent requests, and a live crawl of every internal link and JSON-LD block. Findings below are graded **PASS**, **WARNING**, or **FAIL**; every WARNING/FAIL includes problem, severity, and recommended fix, per instruction.

---

## 0. Automated suite results (ground truth)

| Check | Result |
|---|---|
| `npm run lint` | **PASS** — 0 errors |
| `npm run typecheck` | **PASS** — 0 errors |
| `npm run test` (Vitest) | **PASS** — 196/196 tests, 22 files |
| `npm run build` (production) | **PASS** — compiles, all 28 routes generated |
| `npm run test:e2e` (Playwright, Desktop Chrome + Mobile Chrome) | **PASS** — 142/142 passed, 2 skipped (expected — cross-project navigation specs that only run under their matching browser project) |
| `npm audit` (prod + dev) | **PASS** — 0 vulnerabilities |

No regressions, no flaky results across two full e2e runs.

---

## 1. Per-tool functional verification (live, real server)

All 8 tools were exercised live against the built app with real fixture files, independent of the automated suite, and their outputs were independently verified (page counts, byte sizes, file-type signatures):

| Tool | Live result |
|---|---|
| Compress PDF | **PASS** — 2,156,870 → 852,647 bytes on a real image-heavy fixture; measured, not claimed |
| Merge PDF | **PASS** — output verified via pdf-lib: 5 pages, widths `[200,200,300,300,300]` — correct order, correct source pages |
| Split PDF | **PASS** — all-pages mode produced a valid ZIP |
| Rotate PDF | **PASS** — valid rotated output |
| Delete PDF Pages | **PASS** — valid output with page removed |
| JPG to PDF | **PASS** — mixed JPG+PNG input produced a valid multi-page PDF |
| PDF to JPG | **PASS** — valid ZIP of rendered pages |
| PDF to Word | **PASS** — output verified with `file(1)`: genuine "Microsoft Word 2007+" document, not just a renamed blob |

---

## 2. Required test scenarios

| Scenario | Result | Evidence |
|---|---|---|
| Valid files | **PASS** | Section 1, plus full e2e suite |
| Invalid files (wrong magic bytes, wrong extension, wrong declared MIME) | **PASS** | Live: a `.pdf`-named file with text content → `CONTENT_TYPE_MISMATCH`; a real PDF renamed `.txt` → `UNSUPPORTED_EXTENSION`; a real PDF declared as `image/jpeg` → `UNSUPPORTED_MIME_TYPE`. All 400s, all clear messages. |
| Empty uploads | **PASS** | Live: 0-byte file → `"The uploaded file is empty."` (400); no file field at all → `"The upload couldn't be read."` (400) |
| Large files | **PASS**, see **WARNING 1** | Live: a 51 MB file against the 50 MB/file limit was rejected in 0.3s with no disk write. A 225 MB combined batch (5×~45 MB, each under the per-file cap) against merge-pdf's 200 MB combined limit was correctly rejected (413) — but only *after* all 225 MB was received and written to disk (1.4s). Workspace was still correctly cleaned up (0 leftover dirs). |
| Corrupted files | **PASS** | Live + full e2e suite (all 8 tools have a dedicated corrupted-fixture test). Error messages are safe and reference only the sanitized filename, never a path or stack trace. |
| Multiple files | **PASS** | Live: 2-file merge and 2-file (JPG+PNG) jpg-to-pdf both correct; e2e suite covers up to the tool-specific max |
| Mobile | **PASS** | Playwright "Mobile Chrome" (Pixel 7) project: 100% pass. Live viewport checks at 320px/390px: zero horizontal overflow on homepage, a tool page, and a legal page. |
| Desktop | **PASS** | Playwright "Desktop Chrome" project: 100% pass. Live viewport check at 1440px: zero overflow. |
| Slow network | **PASS** | Live, via CDP `Network.emulateNetworkConditions` (400kbps/400ms latency, "Slow 3G"-like): full merge flow (upload → process → download-ready) completed correctly with no premature client-side timeout. Confirms the app has no artificial client-side fetch timeout and correctly defers to the server's own processing timeout. |
| Failed processing | **PASS** | Live + e2e: corrupted files, invalid option values (e.g. `angle=45`), and malformed JSON in an options field (`pages=not-json{{{`) all produce clean 400s with no crash |
| Repeated processing | **PASS** | Live: same two files merged 3× in a row — 3 independent job IDs, identical correct output size each time, no state leakage between runs |
| Concurrent processing | **PASS** | Live: 5 simultaneous merge requests — all 5 succeeded independently with correct, isolated output (per-job random-UUID workspace isolation holds up under real concurrency, not just in theory) |
| Cleanup | **PASS** | Live: workspace directory count went 0→1 after processing, back to 0 immediately after download; a rejected 225 MB job's workspace was also fully removed. Backstop sweep (15-min interval, 60-min TTL) verified via passing unit tests (`sweepExpiredWorkspaces`). |
| Unauthorized file access | **PASS** | Live race-condition test: 10 simultaneous requests to the same single-use download link — exactly 1 succeeded (200), the other 9 got 404. `consumeJobOutput()`'s check-and-delete is synchronous (no `await` between them), so it's atomic under Node's event loop regardless of concurrent request volume. |
| Path traversal attempts | **PASS** | Live, against `/api/download/[id]`: literal `../../../../etc/passwd`, URL-encoded (`..%2f...`), Windows-style (`..%5c...`), null-byte (`%00.pdf`), and a 5,000-character id were all tried — every one returned a safe 404. The URL's `id` is only ever used as an opaque `Map` key; it never touches the filesystem, so traversal is structurally impossible, not just filtered. |
| Invalid MIME types | **PASS** | Same as "Invalid files" above |

---

## 3. Review categories

### SEO — PASS, 1 WARNING
- All 13 indexable pages (homepage, 8 tools, 4 legal) have unique `<title>`, unique meta description, canonical `<link>`, full Open Graph + Twitter Card tags including a real generated 1200×630 image — verified live, no duplicates.
- JSON-LD validated as well-formed on all 8 tool pages (`WebSite`, `SoftwareApplication`, `BreadcrumbList`, `FAQPage` — 4 blocks each, all parse as valid JSON).
- `sitemap.xml` and `robots.txt` live and correct; every sitemap URL resolves to 200; `/api/*` is excluded from both crawling (robots.txt `Disallow`) and indexing (`X-Robots-Tag: noindex, nofollow`).
- **WARNING (SEO-1) — Homepage canonical URL doesn't exactly match its sitemap entry.**
  - **Problem:** `sitemap.xml` lists the homepage as `https://goatpdf.app/` (trailing slash); the homepage's own `<link rel="canonical">` and `og:url` render as `https://goatpdf.app` (no trailing slash). Caused by `alternates: { canonical: "/" }` resolving differently than the sitemap's explicit string.
  - **Severity:** Low / cosmetic. Search engines near-universally treat a bare root domain and its trailing-slash form as equivalent; no known case of this causing an indexing problem. Flagged for correctness, not urgency.
  - **Recommended fix:** In `src/lib/seo.ts` / `src/app/layout.tsx`, make the homepage's canonical path exactly `"/"` resolved consistently, or normalize `sitemap.ts`'s homepage entry to drop the trailing slash to match.

### Accessibility — PASS, 2 WARNINGS
- No `<img>` elements anywhere (site uses inline SVG only) — zero risk of missing alt text.
- All 19 icon components inherit `aria-hidden: true` from a shared base object — verified in `icons.tsx`.
- Keyboard-operable dropzone, disclosure nav (`<details>`/`<summary>`), focus-visible rings on all interactive controls (added Phase 9).
- `lang="en"` set; viewport meta present; heading hierarchy (h1 → h2) correct on every page checked.
- **WARNING (A11Y-1) — Several real content elements fail WCAG AA text contrast.**
  - **Problem:** `text-slate-400` on a white background computes to a **2.56:1** contrast ratio (WCAG AA requires 4.5:1 for normal text, 3:1 for large text). This class is used for real, non-decorative text in multiple places: the footer's copyright line (`Footer.tsx:58`), file-size labels in `UploadZone.tsx`/`ReorderableFileList.tsx`, the page-range/upload hint text in `SplitPdfTool.tsx`/`UploadZone.tsx`, and the reorder-list index numbers. (Its use for `disabled:text-slate-400` on buttons is *not* a violation — WCAG explicitly exempts disabled controls.)
  - **Severity:** Medium. A real WCAG 2.1 AA violation (1.4.3 Contrast Minimum) affecting several low-vision users' ability to read secondary content; doesn't block core task completion (upload/process/download all remain operable).
  - **Recommended fix:** Replace `text-slate-400` with `text-slate-500` (4.76:1, passes) for all non-decorative text uses; leave the `disabled:` variant as-is.
- **WARNING (A11Y-2) — No skip-to-content link.**
  - **Problem:** No mechanism to bypass the header/nav and jump straight to main content. On the tool pages, a keyboard or screen-reader user must tab through the logo link and the full "Tools" dropdown before reaching the upload widget, on every single page.
  - **Severity:** Low. WCAG 2.4.1 (Bypass Blocks). Common, well-understood, cheap to fix.
  - **Recommended fix:** Add a visually-hidden-until-focused "Skip to content" link as the first focusable element in `layout.tsx`, targeting `<main>`.

### Performance — PASS
- All static pages (homepage, tools, legal) respond in single-digit milliseconds locally; correctly served with `gzip` compression and appropriate `Cache-Control` (`immutable, max-age=31536000` on hashed static chunks; `s-maxage` on pages).
- Client JS is well-scoped: only 17 files carry `"use client"`, essentially exactly the interactive tool widgets — no accidental heavy client bundle.
- Zero console errors or warnings across 5 representative pages checked in a real headless browser (homepage, a tool page, PDF to Word, Privacy, About).
- `next/font` self-hosts fonts at build time — no runtime font-loading request to a third party.

### Privacy — PASS
- Re-verified the Privacy Policy's claims against the actual code (not just re-reading the page): temp-file TTL (60 min) and sweep interval (15 min) match `cleanup.ts`'s real constants; the "what we log" claim matches `logger.ts`'s structurally-narrow `JobLogEvent` type; the Analytics section's "off by default" claim matches `track.ts`'s `ANALYTICS_ENABLED` gate (confirmed via passing unit tests that assert zero console output and zero network calls when unset).
- No cookies, no client-side third-party scripts, no filenames or file content in any log path or analytics event by construction (type-level, not just convention).

### Security — PASS, 3 WARNINGS
- Security headers present and correct on every route (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`) — verified live.
- Rate limiting verified live, not just unit-tested: 20 requests/5 min per IP across the 8 processing endpoints (shared bucket), confirmed by driving a real IP to a real `429` with a correct `Retry-After` header.
- No debug/admin/internal routes exposed (`/api/debug`, `/api/jobs`, `/admin`, `/.env` all correctly 404); `public/` is empty; `.env*` is gitignored.
- `npm audit`: 0 vulnerabilities.
- **WARNING (SEC-1) — Combined-size limit check happens after the full request is already buffered and staged to disk.**
  - **Problem:** For multi-file tools (merge-pdf, jpg-to-pdf), the per-file size check runs early (before any disk I/O — confirmed: a single 51 MB file is rejected in 0.3s with zero workspace created). But the *combined*-size check (200 MB total) runs *inside* the tool's processor, which only executes after `request.formData()` has fully buffered the entire multipart body in memory **and** every file has already been written to a temp workspace on disk. Live-verified: a 225 MB combined upload took 1.4s and visibly staged all 5 files to disk before being rejected.
  - **Severity:** Medium. Bounded, not unbounded — a single request is capped at `maxFiles × 50 MB` (worst case ~1.5 GB for jpg-to-pdf's 30-file limit) and further bounded by the 20 req/5 min rate limit — but it's still real, avoidable memory/disk churn per rejected request, and a moderately resourced attacker could use it to pressure a small/self-hosted deployment's memory or disk I/O.
  - **Recommended fix:** Move the combined-size check into `runProcessingJobWithConfig` (in `runProcessingJob.ts`), using the already-available `RawUploadedFile.size` values, and run it immediately after the existing min/max-file-count checks — before `createJobWorkspace()`/`writeWorkspaceFile()` are ever called. As a second layer, consider an early `Content-Length` header check in each route before calling `request.formData()` at all, since Next.js route handlers have no built-in body-size cap (unlike Server Actions' `bodySizeLimit`).
- **WARNING (SEC-2) — CSP allows `'unsafe-inline'` for `script-src` and `style-src` (previously acknowledged, re-flagged here for completeness).**
  - **Problem:** `next.config.ts`'s CSP includes `script-src 'self' 'unsafe-inline'`. This was a deliberate, documented Phase 10 trade-off (the App Router injects its own inline hydration scripts, and a correct nonce-based CSP would require converting every currently-static page to per-request dynamic rendering). No exploitable injection vector was found during this audit (no `dangerouslySetInnerHTML` with user input anywhere; the one legitimate use, `JsonLd.tsx`, renders only static developer-authored data).
  - **Severity:** Low, given the absence of any injection vector — but it does remove a meaningful layer of defense-in-depth, and should be re-evaluated if the app ever adds a feature that renders user-supplied HTML.
  - **Recommended fix:** No action required now; revisit nonce-based CSP (with `middleware.ts`) if/when dynamic rendering is acceptable, or the app's risk profile changes.
- **WARNING (SEC-3) — No test exercises a real, actually-encrypted PDF.**
  - **Problem:** Existing tests (unit and e2e) that mention "password protected" only check that the *generic* corrupted-file error message happens to include that phrase as a possible cause — none of them upload a genuinely password-protected/encrypted PDF. Code review gives reasonable confidence this already works (`PDFDocument.load()` is called without `{ ignoreEncryption: true }` anywhere in `loadPdf.ts` or `usePdfPageCount.ts`, so pdf-lib's default behavior — throwing on encrypted input — should be preserved and caught by the existing try/catch), but this is inferred, not verified. No tool to generate a real encrypted PDF was available in this environment (no `qpdf`, no working Python/pypdf) to close the gap during this audit.
  - **Severity:** Low. Code-level reasoning strongly suggests correct behavior already; this is a test-coverage gap, not a known defect.
  - **Recommended fix:** Add one real encrypted-PDF fixture (generate with `qpdf --encrypt ...` in CI or via any PDF library that supports it) and one test per representative tool asserting a clean `UNREADABLE_FILE`/"couldn't be read" response.

### Error handling — PASS, 1 WARNING
- Every processing/validation error returns a safe, user-readable message with no stack trace, internal path, or raw exception text — verified live across corrupted files, invalid option values, and malformed JSON option payloads.
- The "never logs document contents" guarantee is structural (the logger's TypeScript type has no field for it), not just convention, and is unit-tested.
- **WARNING (ERR-1) — Generic, unbranded 404 page; no custom error boundary.**
  - **Problem:** `/this-page-does-not-exist` correctly returns HTTP 404 and *does* retain the site's real Header/Footer (navigation still works), but the actual "not found" content block is Next.js's bare, hardcoded-inline-style default ("404 / This page could not be found."), and the `<title>` is the generic Next.js default rather than something on-brand. There is also no `src/app/error.tsx` React error boundary — if a client-rendering error occurs, the app falls back entirely to Next's default handling rather than an on-brand recovery UI.
  - **Severity:** Low. Purely cosmetic/UX — functionally correct (right status code, right meta, `noindex` present, nav still usable), just not polished or on-brand.
  - **Recommended fix:** Add `src/app/not-found.tsx` (styled to match the site, with a clear link back to the tools grid) and `src/app/error.tsx` (a simple on-brand "something went wrong, try again" boundary).

### Responsive design — PASS
- Verified live: zero horizontal overflow (`scrollWidth === clientWidth`) at 320px, 390px, 768px, and 1440px viewports across homepage, a tool page, and a legal page.
- Full Playwright "Mobile Chrome" project (Pixel 7 viewport) passes 100%.

### Broken links — PASS
- Live crawl of all 13 indexable pages discovered 18 unique internal links; every one resolves to 200. Every `sitemap.xml` URL resolves to 200. The 404 route correctly returns 404 for a genuinely nonexistent page.

---

## 4. Summary

| Severity | Count | Items |
|---|---|---|
| **FAIL** | 0 | — |
| **WARNING** | 8 | SEO-1, A11Y-1, A11Y-2, SEC-1, SEC-2, SEC-3, ERR-1, (dependency-freshness note below) |
| **PASS** | Everything else | All 8 tools, all 17 required test scenarios, and 6 of 8 review categories with no findings at all |

**No blocking defects were found.** Every one of the 8 MVP tools works correctly end-to-end, was independently re-verified live (not just via the existing automated suite), and the app held up correctly under adversarial testing (path traversal, race conditions, oversized/malformed uploads, concurrent load, rate-limit pressure). All 8 findings above are real and worth fixing, but none of them break a tool, expose a file to the wrong person, or leak data — they are hardening and polish items on an otherwise solid, working MVP.

**Not in scope for this audit / not evaluated:** the Dockerfile and actual deployment (still not built — tracked as CLAUDE.md's own Phase 8 "Pre-launch," and the user's instruction was explicitly "Do not proceed to deployment"). Dev-tooling packages (`@types/node`, `eslint`, `typescript`) are behind their latest majors with zero known vulnerabilities — informational only, not a finding.

No fixes have been applied. Per instruction, this report is findings-only.

# GOAT PDF — Week 1 Production QA Report

**Date:** 2026-09-01
**Target:** live production deployment at `https://goatpdf.onrender.com/` (Render, Docker, free plan)
**Scope:** all 8 MVP tools — upload, validation, processing, download, error handling, loading states, mobile UI, desktop UI, temp file handling, cleanup. No new features added or proposed.
**Method:** automated suite (lint/typecheck/unit/build) run locally, plus direct live HTTP testing of every tool's real API against the production URL (valid input, corrupted input, disguised MIME type, missing fields, empty file, all-pages-deleted guard, rate limiting, single-use download, security headers). This is real traffic against the real deployed app, not a simulation.

---

## 1. Automated suite results

| Check | Result |
|---|---|
| `npm run lint` | ✅ Clean, no errors/warnings |
| `npm run typecheck` | ✅ Clean, no errors |
| `npm run test` (unit) | ⚠️ 174/174 tests passed across 20 files. **2 files failed to load at all** (`tests/unit/pdf/pdfToJpg.test.ts`, `tests/unit/processing/runProcessingJob.test.ts`) — see QA-1 below. Not a code defect. |
| `npm run build` (production build) | ❌ Fails on this machine — same root cause as QA-1. Could not be freshly re-verified locally today. |
| `npm run test:e2e` | ❌ Could not run — Playwright's `webServer` runs `npm run build` first, which fails for the same reason. |

Because the local build/e2e path is currently blocked (see QA-1), this audit substituted **direct live testing against the actual production deployment** for functional verification of all 8 tools — arguably stronger evidence than a local build, since it's the real artifact currently serving users.

---

## 2. Per-tool live production results

All tests below were run against `https://goatpdf.onrender.com` with real fixture files.

| Tool | Valid upload → download | Corrupted/invalid file | Other validation | Status |
|---|---|---|---|---|
| Compress PDF | ✅ 852,648 B from a 2,156,870 B input (~60.5% real reduction, measured not claimed), genuine PDF verified | ✅ rejected via existing test coverage (not re-run live) | — | Pass |
| Merge PDF | ✅ genuine merged PDF, 3.3s | ✅ `UNREADABLE_FILE`, safe message | ✅ disguised JPEG renamed `.pdf` rejected by magic-byte check (`VALIDATION_FAILED`, "contents don't match its name"); ✅ 0-byte file rejected ("The uploaded file is empty") | Pass |
| Split PDF | ✅ genuine split PDF (ranges mode) | — | — | Pass |
| Rotate PDF | ✅ genuine rotated PDF | — | ✅ missing `angle` correctly rejected with a clear message | Pass |
| Delete PDF Pages | ✅ genuine PDF with pages removed | — | ✅ deleting every page on a 5-page file correctly blocked server-side (`"You can't delete every page — at least one page must remain."`) | Pass |
| JPG to PDF | ✅ genuine output PDF from a JPEG | — | ✅ wrong file type (PDF where an image is required) rejected with a clear message | Pass |
| PDF to JPG | ✅ genuine 4-page ZIP of valid JPEGs (300×390, correct JFIF headers), 3.0s — confirms the pdfjs-dist + `@napi-rs/canvas` + font/cmap asset pipeline works correctly on the production Linux/Docker container | — | — | Pass |
| PDF to Word | ✅ genuine `.docx` (real `word/document.xml` content + embedded image, opens as Word 2007+), **10.0s** on the free tier's 512MB RAM / 0.1 CPU — confirms LibreOffice headless conversion works under real production resource constraints | ✅ `UNREADABLE_FILE`, safe message, LibreOffice never invoked | — | Pass |

No tool returned a 500 error, a stack trace, an internal file path, or any other unsafe/leaky error content in any test above.

## 3. Cross-cutting checks

| Area | Result |
|---|---|
| Security headers | ✅ Present and correct on every response checked: CSP, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. `/api/*` responses also carry `X-Robots-Tag: noindex, nofollow`. |
| Rate limiting | ✅ Confirmed live: the 5th rapid request to the shared processing bucket returned `429` with `Retry-After: 132` and a safe generic message (`RATE_LIMITED`) — matches the documented 20 req/5 min per-IP config. |
| Single-use download | ✅ Confirmed: re-requesting the same `jobId` after one successful download returns `404`, with full security headers still present (no information leakage on the 404 path either). |
| Loading/error states (code-level, not re-run live) | Every tool page follows the shared `ToolActionBar`/`ProcessingState`/`ErrorMessage` pattern (unchanged since Phase 5.5); not independently re-tested visually this pass — see QA-1. |
| Mobile UI / Desktop UI | Not independently re-verified visually this pass (see QA-1 — Playwright's `Mobile Chrome` (Pixel 7) and `Desktop Chrome` projects, which exist and last passed in this project's history, could not be run locally today). Live production HTML does carry the correct `<meta name="viewport" content="width=device-width, initial-scale=1"/>` tag, and responsive Tailwind breakpoint classes are present in the shared components (`UploadZone`, `ToolPageLayout`, etc.) on code review. |
| Temp file handling / cleanup | Cannot be directly inspected on the live Render container (no filesystem/shell access to production). Verified indirectly: (1) single-use download behavior above proves per-job registry entries are invalidated after use; (2) the underlying cleanup sweep (`cleanup.ts`, 1-hour TTL) and traversal-guarded temp storage (`tempStorage.ts`) are unchanged from what was directly verified inside the running Docker container during pre-deployment testing (documented in `DEPLOYMENT.md`) — workspace count observed going 0→1→0 around a real download. |

---

## 4. Findings

| ID | Severity | Area | Finding | Recommended fix |
|---|---|---|---|---|
| **QA-1** | **HIGH** | Local dev environment | A Windows Application Control policy on this machine now blocks `@napi-rs/canvas`'s native binary (`skia.win32-x64-msvc.node`) from loading at all. This breaks `npm run build`, `npm run test:e2e`, and 2 of 22 unit test files (`pdfToJpg.test.ts`, `runProcessingJob.test.ts`) locally — not because of a code defect (the file exists, is the correct size, and the same dependency works correctly on the production Linux container, confirmed live in §2's PDF to JPG test), but because the OS is refusing to execute it. This silently defeats the project's "tests must pass before a phase is reported complete" process for any future change touching this machine, until resolved. | Identify and adjust the blocking policy (likely Windows Defender Application Control / Smart App Control flagging a newly-written, unsigned `.node` file) on this machine, or run `npm run build`/`test`/`test:e2e` inside WSL2/Docker instead (already set up and proven working in this project) until the Windows-side policy is fixed. |
| **QA-2** | **HIGH** | SEO / production config | `NEXT_PUBLIC_SITE_URL` still has not been set in Render's dashboard. Every page's canonical URL, Open Graph `og:url`, and **all JSON-LD structured data** (`WebSite`, tool `ItemList`, every `SoftwareApplication`/`BreadcrumbList`/`FAQPage` entry) on the live site currently self-report the placeholder domain `https://goatpdf.app` instead of the real `https://goatpdf.onrender.com`. This has been live and indexable since the deployment succeeded. | In Render's dashboard → `goatpdf` service → Environment tab, set `NEXT_PUBLIC_SITE_URL=https://goatpdf.onrender.com` (or the final custom domain, once chosen). This is a build-time value, so saving it triggers an automatic rebuild. |
| **QA-3** | **MEDIUM** | Infra / scaling risk | Render's free plan (512MB RAM / 0.1 CPU) successfully handled every tool in this audit, including LibreOffice (PDF to Word, 10.0s) and image rasterization (PDF to JPG) — but only under single-request, small-fixture conditions. Combined-upload limits allow up to 200MB across multiple files (Merge/JPG to PDF), and this hasn't been tested under concurrent multi-user load on this resource tier. This is a known, already-documented risk (see `render.yaml` comments), not a confirmed defect. | If real usage shows timeouts/OOM/slow responses under load, upgrade the Render plan (`starter` tier) — already called out as the fix in `render.yaml`. |
| **QA-4** | **LOW** | Test coverage (this pass) | Mobile/desktop visual UI, per-tool loading-state visuals, and direct temp-file-on-disk cleanup could not be independently re-verified this pass due to QA-1 (no local build) and lack of shell access to the production container. Substituted with code review + prior verified state + indirect live evidence (see §3). | Re-run `npm run test:e2e` (both Desktop Chrome and Mobile Chrome projects) once QA-1 is resolved, to get fresh, direct confirmation rather than relying on prior state. |
| **QA-5** | **LOW** | Free-tier cold start | Render's free plan spins down after 15 minutes idle; a genuine cold start (30–60s+) was not observed today (both homepage checks returned quickly), so this risk remains flagged but unmeasured against a truly idle instance. | Optional: a scheduled uptime ping (e.g. a free external monitor hitting `/` every 10 min) avoids the free tier's spin-down at the cost of using more of the 750 free monthly hours — a product/cost tradeoff for the user to decide, not a code fix. |

**0 CRITICAL issues.** Every tool's core upload → process → download flow works correctly on the live production deployment, with real, correctly-formed output files verified for all 8 tools, and no evidence of a live-user-facing functional break.

---

## 5. Summary

All 8 MVP tools are functioning correctly in production today, verified with real files against the real deployed URL — not assumed. Validation, error handling, rate limiting, security headers, and the delete-all-pages guard all behave exactly as designed, including under live adversarial testing (disguised file types, corrupted files, empty files, rapid-fire requests). No CRITICAL or user-facing HIGH-severity functional defect was found.

The two HIGH findings are both process/config gaps rather than broken functionality: QA-1 (this machine can no longer locally build or test the app, which needs fixing before the next code change ships) and QA-2 (a known follow-up — setting one environment variable in Render — that was flagged after the initial deployment and has not yet been done).

**No changes were deployed as part of this audit**, per instructions.

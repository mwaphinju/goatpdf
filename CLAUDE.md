# CLAUDE.md — GOAT PDF

This file is the source of truth for how this project is built. Read it in full before starting any phase of work.

## Product

**GOAT PDF** — "Free PDF tools that just work."

A free, fast, mobile-friendly, ad-supported (future) PDF utility website. No accounts, no payments, no subscriptions.

### MVP tools (exactly these 8, nothing more)

1. Compress PDF
2. Merge PDF
3. Split PDF
4. Rotate PDF
5. Delete PDF Pages
6. JPG to PDF
7. PDF to JPG
8. PDF to Word

### Explicit non-goals (do not build, do not suggest)

- User accounts / login / social login
- Subscriptions or payments
- Public API
- OCR
- Advanced AI features
- Admin dashboard
- Any database beyond what's strictly needed (MVP needs **no** database)
- Microservices — this is a single deployable app
- Any tool outside the 8 listed above

AdSense is a **future** step, not part of MVP scope. Don't wire it up unless a phase explicitly says to.

---

## Architecture

### Decision summary

PDF-to-Word requires real document conversion (LibreOffice headless) and Compress benefits from real image re-encoding — neither works well as a static/serverless-only or pure-client-side design. Confirmed with the user:

- **Processing location:** server-side. Files upload to the backend, get processed, get downloaded, then get deleted.
- **Deployment:** Docker on a PaaS (Render/Railway/Fly.io-style) — a Dockerfile bundles Node + LibreOffice + native deps. No self-managed VPS ops, no serverless binary/filesystem constraints.

### Stack

- **Framework:** Next.js (App Router) + TypeScript — one codebase for frontend pages and backend API routes. Right-sized for a solo dev: no separate frontend/backend repos or deploys.
- **Styling:** Tailwind CSS — fast to build mobile-responsive UI without a component library dependency.
- **PDF processing:**
  - `pdf-lib` — Merge, Split, Rotate, Delete Pages, JPG→PDF (pure JS, no native binary).
  - `pdf.js` (page rendering) + `sharp` — PDF→JPG.
  - `pdf-lib` + `sharp` — Compress (downsample/re-encode embedded images, strip redundant data). Pure-JS first; Ghostscript is an explicit future option if compression ratios prove insufficient, not part of MVP.
  - LibreOffice headless (`soffice --headless --convert-to docx`) via `child_process` — PDF→Word. The one tool with a real native dependency; isolate it behind a single module so it can be swapped later without touching other tools.
- **Storage:** local ephemeral filesystem only. No S3, no database. Each job gets a directory named with a `crypto.randomUUID()`. This is sufficient because files live minutes, not days.
- **Job state:** in-memory only (per-process `Map`), scoped to the lifetime of a single request/job. No persistence needed — if the process restarts, in-flight jobs are simply gone, which is acceptable for a stateless free tool.
- **Testing:** Vitest (unit tests for `lib/pdf/*` processing functions), Playwright (end-to-end: upload → process → download, per tool).
- **Deployment:** Dockerfile (Node + LibreOffice installed at build time) deployed to a Docker-capable PaaS.

### Directory structure

```
GOATPDF/
  CLAUDE.md
  README.md
  Dockerfile
  .dockerignore
  .gitignore
  package.json
  next.config.js
  tailwind.config.ts
  tsconfig.json
  public/
  src/
    app/
      layout.tsx
      page.tsx                      # homepage — 8 tool cards
      tools/
        compress-pdf/page.tsx         # real tool — CompressPdfTool
        merge-pdf/page.tsx           # real tool — MergePdfTool, not the shared placeholder shell
        split-pdf/page.tsx           # real tool — SplitPdfTool
        rotate-pdf/page.tsx          # real tool — RotatePdfTool
        delete-pdf-pages/page.tsx    # real tool — DeletePagesTool (note: slug is "delete-pdf-pages", not "delete-pages")
        jpg-to-pdf/page.tsx          # real tool — JpgToPdfTool
        pdf-to-jpg/page.tsx          # real tool — PdfToJpgTool
        pdf-to-word/page.tsx         # real tool — PdfToWordTool
      privacy/page.tsx               # static — Privacy Policy, describes the actual implementation only
      terms/page.tsx                 # static — Terms of Service
      about/page.tsx                 # static — About GOAT PDF
      contact/page.tsx               # static — Contact
      api/
        compress-pdf/route.ts        # POST — parses a preset form field
        merge-pdf/route.ts           # POST
        split-pdf/route.ts           # POST — parses mode/ranges form fields alongside the file
        rotate-pdf/route.ts          # POST — parses angle/pages form fields
        delete-pdf-pages/route.ts    # POST — parses pages form field
        jpg-to-pdf/route.ts          # POST — parses pageSize/orientation/margin form fields
        pdf-to-jpg/route.ts          # POST — parses quality/pages form fields
        pdf-to-word/route.ts         # POST — no extra options, just the file
        download/[id]/route.ts       # GET — single-use, in-memory-registry-backed file download, content-type aware (pdf, zip, jpeg, or docx); fires download_completed
        analytics/route.ts            # POST — public ingestion point for client-side events (page_view/tool_view/file_upload only); validates via parseClientAnalyticsEvent() before calling trackEvent()
      sitemap.ts                    # MetadataRoute.Sitemap — homepage, tool pages, legal pages; no /api/ URLs
      robots.ts                     # MetadataRoute.Robots — disallows /api/, points at sitemap.xml
      opengraph-image.tsx            # next/og-generated 1200×630 social preview image, shared by every page (see seo.ts)
    components/
      JsonLd.tsx                     # embeds one JSON-LD structured-data block via a <script type="application/ld+json">
      analytics/
        AnalyticsPageView.tsx         # renders nothing — fires page_view (+ tool_view on a tool page) on every route change; mounted once in the root layout
      layout/                       # Header.tsx, Footer.tsx
      ui/                           # Button.tsx, UploadZone.tsx, ErrorMessage.tsx, ProcessingState.tsx, ResultDownload.tsx
      tools/
        ToolPageLayout.tsx           # shared heading/description wrapper + RelatedTools, used by all 8 tool pages
        RelatedTools.tsx             # "Related tools" section (next 3 tools, via getRelatedTools() in lib/tools.ts)
        PdfPageCountStatus.tsx       # shared "Reading your PDF… / N pages / couldn't read it" block — used by Split, Rotate, Delete, PDF to JPG
        ToolActionBar.tsx            # shared primary-action + "Start over" button row — used by all 8 tools
        MergePdfTool.tsx             # merge-pdf's real, dedicated UI: add/remove/reorder files, real upload, processing/success/error states
        SplitPdfTool.tsx             # split-pdf's real, dedicated UI: client-side page count, all-pages/ranges mode, live range validation
        RotatePdfTool.tsx            # rotate-pdf's real, dedicated UI: angle picker, all-pages/selected-pages scope
        DeletePagesTool.tsx          # delete-pdf-pages's real, dedicated UI: page picker, blocks deleting every page
        CompressPdfTool.tsx          # compress-pdf's real, dedicated UI: preset picker, measured original/compressed/saved/reduction stats
        JpgToPdfTool.tsx             # jpg-to-pdf's real, dedicated UI: reorderable multi-image upload, page size/orientation/margin
        PdfToJpgTool.tsx             # pdf-to-jpg's real, dedicated UI: quality picker, all-pages/select-pages scope
        PdfToWordTool.tsx            # pdf-to-word's real, dedicated UI: no options, just a formatting disclaimer shown before *and* after conversion
        PageSelector.tsx             # shared page-picker grid (select all/none/invert) — used by Rotate, Delete, and PDF to JPG
        ReorderableFileList.tsx      # shared reorderable file list (move up/down + native drag) — used by Merge and JPG to PDF
      legal/
        LegalPageLayout.tsx           # shared title/"last updated"/section wrapper for privacy, terms, about, contact
      ToolCard.tsx
      icons.tsx                     # hand-written inline SVG icons — no icon library dependency
    lib/
      tools.ts                      # the 8-tool registry (slug, name, description, intro, howTo, faqs, curated relatedSlugs, accept type, icon) — drives nav, homepage, footer, routes, and per-tool SEO content; also getRelatedTools()
      seo.ts                        # SITE_URL/SITE_NAME, absoluteUrl(), buildPageMetadata()/buildToolMetadata() — canonical + Open Graph + Twitter card for every page
      structuredData.ts             # JSON-LD builders: WebSite, ItemList, SoftwareApplication, BreadcrumbList, FAQPage
      cn.ts                         # tiny classname-join helper (no clsx/tailwind-merge dependency)
      format.ts                     # formatBytes — unit-tested
      downloadFile.ts               # shared blob-fetch download helper — used by all 8 tools' success state
      hooks/
        usePdfPageCount.ts           # client-side page count via a dynamically-imported pdf-lib — shared by Split, Rotate, Delete, PDF to JPG
      files/
        validate.ts                  # size/extension/MIME/magic-byte validation (pdf, jpeg, png), filename sanitization
        tempStorage.ts                # random-UUID job workspaces, traversal-guarded read/write/remove
        cleanup.ts                   # TTL sweep + startCleanupScheduler(), run from instrumentation.ts
        contentType.ts                # extension → MIME type, for download response headers
      processing/
        types.ts                     # ToolId, ToolConfig, ToolProcessor, ProcessingContext (carries tool-specific `options`)/-Result
        toolConfigs.ts                # the 8 tools' validation rules — all 8 now point at real processors
        runProcessingJob.ts           # shared orchestrator: validate → stage → run processor w/ timeout → cleanup on failure
        jobRegistry.ts                # in-memory jobId → output-file map backing the single-use download route
        apiHelpers.ts                 # shared route plumbing: extractFilesFromFormData(), buildJobResponse(), HTTP status mapping, rateLimitResponse()
        timeout.ts                   # withTimeout() — races a processor against its configured timeout
        errors.ts                    # ProcessingJobError hierarchy — safe code+message, never raw internals
        logger.ts                    # logJobEvent() — structurally cannot accept file content, only {jobId, toolId, event, ...}
      security/
        rateLimit.ts                  # in-memory per-IP sliding-window limiter + periodic bucket sweep, run from instrumentation.ts
        clientIp.ts                   # clientIpFromRequest() — shared by rateLimit.ts and analytics/track.ts's visitor-IP forwarding
      analytics/
        events.ts                     # ANALYTICS_EVENTS/AnalyticsEvent — structurally narrow, like logger.ts's JobLogEvent; parseClientAnalyticsEvent() validates the public endpoint's input
        track.ts                      # trackEvent() — off unless ANALYTICS_ENABLED=true; logs locally and/or forwards to ANALYTICS_ENDPOINT_URL, never throws
        trackClientEvent.ts            # "use client" — sendBeacon (fallback: fetch) to this app's own /api/analytics; never talks to a third party directly
      pdf/
        loadPdf.ts                   # loadPdfOrThrow() — the one safe way every tool loads a PDF via pdf-lib; getPageCount() stays inside load()'s try/catch since pdf-lib can parse a broken PDF "successfully" and only throw once you touch its page tree
        pdfRenderer.ts                # renderPdfPagesToJpeg() — rasterizes PDF pages via pdfjs-dist + @napi-rs/canvas; see "PDF rasterization design notes" below
        mergePdf.ts                  # real pdf-lib merge implementation
        splitPdf.ts                  # real pdf-lib split implementation — all-pages (zipped) and page-range extraction modes
        pageRanges.ts                 # parsePageRanges() — pure, shared by client (instant feedback) and server (authoritative check) for text-range input
        pageSelection.ts              # resolveSelectedPages() — server-only "all or explicit page numbers" resolver, shared by Rotate and PDF to JPG
        rotatePdf.ts                  # real pdf-lib rotate implementation — 90/180/270°, all pages or a selected subset (additive, not absolute, rotation)
        deletePages.ts                # real pdf-lib delete implementation — refuses to delete every page
        compressPdf.ts                # real pdf-lib + sharp compression — see "Compress PDF design notes" below
        jpgToPdf.ts                   # real pdf-lib implementation — JPG/PNG in, one page per image, page size/orientation/margin
        pdfToJpg.ts                   # real implementation on top of pdfRenderer.ts — single JPEG or zipped JPEGs depending on page count
        pdfToWord.ts                  # real implementation shelling out to LibreOffice headless — see "PDF to Word design notes" below
    types/
  instrumentation.ts                # Next.js server-startup hook — starts the cleanup scheduler
  tests/
    unit/
      format.test.ts
      files/                        # validate, tempStorage (incl. traversal-protection tests), cleanup
      processing/                   # runProcessingJob.test.ts — valid/invalid/oversized/timeout/error/no-content-logging
      pdf/                          # mergePdf, splitPdf, pageRanges, rotatePdf, deletePages, compressPdf, jpgToPdf, pdfToJpg, pdfToWord — page order, corrupted-file handling, range/selection validation, combined-size limit, measured-reduction assertions, quality/resolution checks, real-docx-content assertions
    e2e/                            # Playwright — homepage, navigation, tool-pages, and a full user-flow spec per tool; fixtures/
```

**All 8 MVP tools are now implemented.** `ToolPageShell.tsx` (the generic "coming soon" placeholder) and its `tests/e2e/fixtures/sample.pdf` fixture were deleted in Phase 8 once nothing referenced them anymore — every tool page now renders its own dedicated component.

### PDF to Word design notes

PDF to Word is the one tool that needs a real, external document-conversion engine — there's no reliable pure-JS way to reflow a PDF into an editable, styled Word document at reasonable fidelity. `pdfToWord.ts` shells out to a locally-installed **LibreOffice headless** (`soffice`), per the architecture decision documented since Phase 0.

- **The critical, non-obvious flag: `--infilter=writer_pdf_import`.** Without it, LibreOffice imports a PDF into **Draw** (an editable-drawing representation) by default, and Draw has no DOCX export filter at all — every conversion attempt fails with "no export filter" / an `Io Class:Write` error, regardless of the `--convert-to docx` target. Forcing the Writer-specific PDF import filter is what makes genuine text reflow into an editable Word document possible. This took real trial-and-error to isolate (see the Phase 8 report) and is exactly the kind of detail that's easy to silently get wrong — if PDF to Word ever stops producing real DOCX output, check this flag first.
- Runs with a **per-job LibreOffice user profile** (`-env:UserInstallation=<job workspace>/lo-profile`) — LibreOffice instances sharing a profile serialize on a lock file, so concurrent conversions need isolated profiles to avoid "another instance is already running" failures.
- `execFile` with an **argument array** (never a shell string) — required by the "sanitize child-process calls" security rule; the input file path is never interpolated into a shell command.
- A `timeout` slightly under the tool's configured job timeout, so the `soffice` child process itself gets killed rather than orphaned if `runProcessingJob`'s own timeout gives up on it first.
- Validates with the same `loadPdfOrThrow` every other tool uses *before* ever spawning LibreOffice — catches corrupted and password-protected PDFs consistently, without depending on LibreOffice's own (less predictable) error behavior for those cases.
- **No claim of perfect conversion, anywhere.** The UI shows an explicit formatting disclaimer both *before* conversion (setting expectations) and again on the success screen (prompting review) — conversion fidelity genuinely varies with document complexity (tables, unusual fonts, images), and that's stated plainly rather than glossed over.
- `soffice` is resolved via `SOFFICE_PATH` (env override) → common Windows install paths → bare `soffice` on `PATH` (the expected case on Linux/Docker). **The Dockerfile still needs LibreOffice installed** for real deployment — not yet built (tracked in the phase list below).
- This tool was developed and tested against a real local LibreOffice install (via `winget`, with the user's explicit approval first, since installing a ~300MB system-wide application is a meaningfully bigger action than an npm install) — not just written against assumed CLI behavior.

### PDF rasterization design notes

PDF to JPG needed real page rasterization — a fundamentally different capability from every other tool, since pdf-lib is a manipulation library only and cannot render pixels.

- **`pdfjs-dist` (latest) + `@napi-rs/canvas`.** An older pdfjs-dist (≤4.1.392) was tried first and works, but `npm audit` flags it with a **high-severity arbitrary-JS-execution-on-malicious-PDF advisory** — disqualifying for a tool whose entire job is processing untrusted uploads. The latest version has that code path removed entirely. `@napi-rs/canvas`, not the unrelated `canvas` package, is required — pdfjs-dist's own bundled Node canvas factory (and its modern `render({ canvas })` API) expects it specifically.
- Both packages are native/asset-heavy and can't be bundled into a Turbopack chunk — they're listed in `next.config.ts`'s `serverExternalPackages` so they're `require()`'d directly from `node_modules` at runtime instead.
- pdfjs-dist's standard-font and CJK cmap data ship as plain files, not bundled into its JS — `standardFontDataUrl`/`cMapUrl` must be passed as plain forward-slashed filesystem paths (its Node fetcher does a bare `fs.readFile(url + filename)`, and it also rejects a Node `Buffer` outright even though `Buffer` is a `Uint8Array` subclass — `pdfRenderer.ts` normalizes both of these).
- `pdfToJpg.ts` validates with `loadPdfOrThrow` (the same battle-tested pdf-lib check every other tool uses) before handing the file to the separate rendering pipeline, so corrupted-file handling stays consistent across all 8 tools rather than depending on pdfjs's own error behavior.
- Output: a single JPEG file when exactly one page is requested, otherwise a ZIP of `page-N.jpg` files (mirrors Split PDF's all-pages-mode convention).

### Compress PDF design notes

Real, general-purpose PDF compression (arbitrary raw bitmaps, CMYK, JPEG2000, CCITT fax, indexed color, transparency) is a large, correctness-sensitive engineering surface. `compressPdf.ts` deliberately scopes down to what can be done *safely*:

- Only re-encodes embedded **JPEG (DCTDecode) images in DeviceRGB or DeviceGray**, without a soft mask (`/SMask`) — the overwhelming majority of real-world photos and scans. Everything else (CMYK JPEGs, PNG/Flate raw bitmaps, indexed color, JPX, CCITT) is left completely untouched rather than risk producing a corrupted or wrong-looking PDF.
- Each matching image is resized (capped at the preset's max dimension, never upscaled) and re-encoded via `sharp` at the preset's JPEG quality, then swapped into the PDF's own object graph in place (`PDFRawStream.of(dict, newBytes)` + `context.assign(ref, ...)`), with `/Width`/`/Height` updated to match.
- **Never returns a file larger than the upload.** After attempting recompression, the candidate output's size is compared to the original; if it isn't smaller, the original bytes are served back unchanged. This is what makes "no fixed percentage, graceful when it doesn't help" concrete: reduction is always accurately measured and reported, and the worst case is 0%, never negative.
- Three presets (`recommended` / `high-quality` / `maximum-compression`) map to JPEG quality + max-dimension pairs — see `PRESETS` in `compressPdf.ts` for exact values.
- A text-only or already-well-compressed PDF may see little or no reduction — this is expected, tested for explicitly (`tests/unit/pdf/compressPdf.test.ts`), and surfaced honestly in the UI rather than papered over.

Each tool's UI page and its `lib/pdf/*` function should be independently understandable — a future contributor should be able to read one tool's code without needing to understand the other seven.

**Current status:** Merge PDF, Split PDF, Rotate PDF, and Delete PDF Pages are fully working — real upload, pdf-lib processing, single-use download, and full Playwright coverage of each user flow. The other 4 tools are still placeholders: their `toolConfigs.ts` processor throws `NOT_IMPLEMENTED` and their page still shows the shared "coming soon" `ToolPageShell`. `lib/pdf/*` (per-tool logic), `api/*/route.ts` (HTTP wiring via the shared `apiHelpers.ts`), `ProcessingContext.options` (for tools needing parameters beyond the file itself), `usePdfPageCount` (client-side page count with no upload needed), and `PageSelector` (a reusable page-picker grid) now exist as a proven, working pattern the remaining 4 tools can each follow. Not yet built: the Dockerfile, `sitemap.ts`/`robots.ts`, and rate limiting / security headers (planned for Phase 8).

**Naming note:** Delete PDF Pages' slug is `delete-pdf-pages` (not `delete-pages`, its original Phase 0/1 name) — renamed in Phase 5 to match the route the user specified. If you're looking for old references to `delete-pages`, they've all been updated.

---

## Coding standards

- TypeScript strict mode. No `any` without a comment explaining why it's unavoidable.
- No abstraction shared across tools unless at least three tools actually need it. Duplication between two tool implementations is fine and preferred over a premature shared helper.
- Keep API routes thin: validate input, call the matching `lib/pdf/*` function, return the result. Business logic lives in `lib/`, not in route handlers.
- No comments explaining *what* code does. Only comment non-obvious *why* (e.g., a LibreOffice quirk, a pdf-lib workaround).
- Prefer editing existing files over creating new ones; don't create new abstractions "for later."
- Format/lint via ESLint + Prettier, enforced in CI.

---

## Security requirements (non-negotiable)

- **Never expose uploaded or generated files publicly.** Files are only reachable through a per-job download route tied to a random job ID — never served from a public static directory.
- **Automatic cleanup.** Every temp file (uploaded input and generated output) must be deleted automatically: immediately after a successful download where feasible, and unconditionally by a periodic sweep (e.g., anything older than 30–60 minutes) as a backstop for abandoned jobs.
- **Secure random identifiers.** All temp file/directory names use `crypto.randomUUID()` or `crypto.randomBytes` — never sequential IDs, timestamps, or user-supplied filenames.
- **Server-side validation.** Every upload is validated server-side: file size limit, and file type verified by magic bytes/content sniffing — never trust the extension or client-reported MIME type.
- **Never log document contents.** Logs may include job ID, tool name, file size, duration, and status/error class — never filenames from the user, extracted text, or file bytes.
- **Rate limiting** on upload/processing endpoints (basic IP-based) since there's no auth layer to lean on.
- **Security headers**: CSP, `X-Content-Type-Options`, `Referrer-Policy`, etc. configured in `next.config.js`.
- **CORS** locked to the site's own origin.
- Downloaded filenames served back to the user must be sanitized (no path traversal, no injected characters).
- Sanitize/validate outputs of any child-process call (LibreOffice) — never pass unsanitized user input into a shell string; use argument arrays, not shell interpolation.

## Privacy requirements

- No user accounts, so no persistent user data to protect beyond the transient file itself.
- State clearly to users (site copy, footer/privacy page) that files are auto-deleted shortly after processing.
- No third-party sharing of uploaded file content. Analytics (if added) must not capture file content or filenames.
- Minimize what's collected at all — page views/tool usage counts are fine; no fingerprinting.

---

## Testing requirements

- Every `lib/pdf/*` function has unit tests (Vitest) covering: valid input, invalid/corrupted input, and edge cases relevant to that tool (e.g., empty page ranges for Split, zero rotation for Rotate, password-protected PDFs rejected cleanly).
- Every tool has at least one Playwright end-to-end test: upload a real sample file → run the tool → assert a valid download is produced.
- Cleanup mechanism has a test proving expired files are actually removed.
- File validation has tests proving disguised/mismatched file types are rejected.
- Tests must pass before a phase is reported complete. Never claim a feature works without having actually run it.

---

## Performance & SEO foundations

- Server-render marketing/tool-description content; keep client JS minimal per page.
- Reasonable upload size limit (defined per tool, enforced both client- and server-side) to keep processing fast and memory-bounded.
- Each tool page has unique `<title>`, meta description, and enough real content to stand on its own for SEO (not just a bare upload widget).
- `sitemap.xml` and `robots.txt` generated via Next.js's built-in support.
- Semantic HTML, accessible forms (labels, focus states, keyboard-operable dropzone).
- Target good Core Web Vitals — no unnecessary client bundles, optimize images in `public/`.

---

## Development process (strict)

**Implement one phase at a time. Never automatically start the next phase.** Stop and report after each phase; wait for explicit go-ahead.

For every phase:

1. Read this file (CLAUDE.md) in full.
2. Inspect the current state of the code (don't assume — check).
3. Implement only what the current phase calls for. Nothing from a later phase.
4. Run the test suite.
5. Fix any failures.
6. Run the production build.
7. Check for regressions in previously completed phases.
8. Update documentation (README.md and this file, if scope/architecture changed).
9. Report exactly what was completed.
10. Report any remaining issues, risks, or follow-ups honestly.

Never claim a feature works unless it has actually been tested end-to-end.

---

## Definition of done (per phase)

A phase is done only when all of the following are true:

- [ ] Code implements exactly the current phase's scope — no more, no less.
- [ ] `npm run lint` and `npm run typecheck` pass.
- [ ] `npm run test` (unit) passes.
- [ ] `npm run test:e2e` passes for any tool affected by this phase.
- [ ] `npm run build` (production build) succeeds.
- [ ] No regression in previously working tools/pages (manually verified, not assumed).
- [ ] Security requirements above are respected for any new upload/file-handling/logging code.
- [ ] README.md / CLAUDE.md updated if the phase changed setup steps or architecture.
- [ ] A clear, honest report is given: what works, what was tested, what's left.

---

## Development phases

Work proceeds in this order. Do not skip ahead or batch phases.

- **Phase 0 — Project setup & foundations** ✅ *done*: Next.js + TypeScript + Tailwind scaffold, ESLint wired up, homepage shell, responsive header/footer/nav, placeholder pages for all 8 tools.
- **Phase 1 — Core file pipeline** ✅ *done*: reusable Button, UploadZone, ErrorMessage, ProcessingState, ResultDownload components; server-side validation (size, extension, MIME, magic-byte sniffing), filename sanitization, temp workspaces under random UUIDs with traversal guards, TTL-based cleanup sweep wired to server startup via `instrumentation.ts`, a shared `runProcessingJob` orchestrator, and the `api/*` + `api/download/[id]` HTTP route handlers (single-use, in-memory-registry-backed downloads, content-type aware). **Not yet done:** the Dockerfile (needed before any real deploy) — everything else in this phase is complete and proven end-to-end by Merge PDF and Split PDF below.
- **Phase 2 — Core pdf-lib tools** ✅ *done* — all four:
  - **Merge PDF**: real pdf-lib implementation ([mergePdf.ts](src/lib/pdf/mergePdf.ts)), dedicated UI ([MergePdfTool.tsx](src/components/tools/MergePdfTool.tsx)) with add/remove/reorder (buttons + native drag-and-drop)/merge/download/start-over, corrupted-file and combined-size-limit handling.
  - **Split PDF**: real pdf-lib implementation ([splitPdf.ts](src/lib/pdf/splitPdf.ts)) with two modes — split into individual pages (zipped via `jszip`) or extract specific page ranges — plus a shared, doubly-used range parser ([pageRanges.ts](src/lib/pdf/pageRanges.ts)) for instant client-side feedback and authoritative server-side validation.
  - **Rotate PDF**: real pdf-lib implementation ([rotatePdf.ts](src/lib/pdf/rotatePdf.ts)), 90°/180°/270° (additive — stacks with any existing rotation), all pages or a chosen subset via the shared [PageSelector](src/components/tools/PageSelector.tsx).
  - **Delete PDF Pages** (slug `delete-pdf-pages`): real pdf-lib implementation ([deletePages.ts](src/lib/pdf/deletePages.ts)) using the same PageSelector; refuses to delete every page, both in the UI (live warning, disabled button) and server-side.
  - All four: client-side page count with no upload needed (shared [usePdfPageCount](src/lib/hooks/usePdfPageCount.ts) hook), unit tests, and full Playwright coverage of their user flows.
- **Phase 3 — Image tools** ✅ *done*: both.
  - **JPG to PDF**: real pdf-lib implementation ([jpgToPdf.ts](src/lib/pdf/jpgToPdf.ts)) accepting JPG *or* PNG, multiple images, reorderable via the shared [ReorderableFileList](src/components/tools/ReorderableFileList.tsx), one page per image with a page-size (A4 / Letter / Fit-to-image) × orientation × margin layout.
  - **PDF to JPG**: real rasterization on top of a new pdfjs-dist + `@napi-rs/canvas` pipeline (see "PDF rasterization design notes" above) — three quality presets, every page or a selection via the shared [PageSelector](src/components/tools/PageSelector.tsx), single JPEG or zipped JPEGs depending on page count.
  - Both: unit tests (page count/order, page-size math, quality/resolution, corrupted-file handling) and full Playwright coverage of their user flows.
- **Phase 4 — Compress PDF** ✅ *done*: real pdf-lib + `sharp` implementation ([compressPdf.ts](src/lib/pdf/compressPdf.ts)) recompressing embedded JPEG images (see "Compress PDF design notes" above for the deliberate safety scope). Three presets (Recommended / High Quality / Maximum Compression); dedicated UI ([CompressPdfTool.tsx](src/components/tools/CompressPdfTool.tsx)) reports actually-measured original size, compressed size, space saved, and percentage reduction — never a claimed/fixed percentage — and gracefully falls back to the original file (0% reduction, no error) when recompression doesn't help. Unit tests cover text/image-heavy/scanned/small/large/already-compressed PDFs plus the CMYK/non-JPEG safety-scope boundaries; full Playwright coverage of the user flow across the same file categories.
- **Phase 5 — PDF to Word** ✅ *done*: real LibreOffice headless integration ([pdfToWord.ts](src/lib/pdf/pdfToWord.ts) — see "PDF to Word design notes" above), conversion-failure handling (`ConversionFailedError`, distinct from corrupted-file handling), explicit before-and-after formatting disclaimer. **Not done yet:** the Dockerfile still needs LibreOffice installed for real deployment — this tool was developed and tested against a local LibreOffice install, not inside a container.

**🎉 All 8 MVP tools are now fully implemented, unit-tested, and covered by Playwright end-to-end flows.** What remains before launch is entirely infrastructure/polish, not tool functionality:

- **Phase 5.5 — UX consistency pass** ✅ *done*: every tool page now follows the same shape via shared components — [ToolPageLayout.tsx](src/components/tools/ToolPageLayout.tsx) (title/icon/description), [PdfPageCountStatus.tsx](src/components/tools/PdfPageCountStatus.tsx) (the "Reading your PDF… / N pages / couldn't read it" block, previously duplicated across Split/Rotate/Delete/PdfToJpg), [ToolActionBar.tsx](src/components/tools/ToolActionBar.tsx) (the primary-action + Start-over row, previously duplicated across all 8 tools), and [downloadFile.ts](src/lib/downloadFile.ts) (the blob-fetch download helper, previously duplicated with inconsistent error-fallback wording per tool). Added a "Related tools" section ([RelatedTools.tsx](src/components/tools/RelatedTools.tsx) + `getRelatedTools()` in [tools.ts](src/lib/tools.ts)) to every tool page. Accessibility fixes: focus-visible ring on UploadZone's dropzone and the small icon buttons in UploadZone/ReorderableFileList (also enlarged their touch targets), `motion-reduce:animate-none` on the processing spinner, `role="status"`/`aria-live="polite"` on the success state so screen readers announce completion. No functional/behavioral changes — verified by the full existing unit + Playwright suite passing unchanged (132 unit tests, 118 e2e tests).
- **Phase 6 — SEO foundation** ✅ *done*:
  - **Per-page metadata** ([seo.ts](src/lib/seo.ts)): `buildPageMetadata()`/`buildToolMetadata()` give every page a unique title, meta description, canonical URL (`alternates.canonical`), and full Open Graph + Twitter Card metadata (including a real image — see below), all derived from a single source per page rather than duplicated by hand across 12 files.
  - **Structured data** ([structuredData.ts](src/lib/structuredData.ts), rendered via [JsonLd.tsx](src/components/JsonLd.tsx)): sitewide `WebSite` (root layout) and homepage `ItemList` of all 8 tools; every tool page emits `SoftwareApplication` (name/description/URL/free `Offer`), a `Home > Tool` `BreadcrumbList`, and `FAQPage` from that tool's real FAQ content.
  - **Real per-tool content** ([tools.ts](src/lib/tools.ts)): each of the 8 tools got a dedicated, hand-written intro paragraph (distinct from its meta description), a 3-step "How it works" list, and 2 genuine FAQ entries — specific to how that tool actually behaves (e.g. Compress PDF's FAQ explains it never returns a larger file; PDF to Word's explains conversion runs through a local engine, not a third-party API). Rendered by [ToolPageLayout.tsx](src/components/tools/ToolPageLayout.tsx) below the tool UI, so every tool page stands on its own for SEO rather than being a bare upload widget — deliberately not "thin" pages, and nothing programmatically templated/keyword-stuffed.
  - **Curated internal links**: [RelatedTools.tsx](src/components/tools/RelatedTools.tsx) now links to 3 *genuinely* related tools per page (e.g. JPG to PDF ↔ PDF to JPG, Split ↔ Merge ↔ Delete Pages ↔ Rotate as a "page management" cluster) via a hand-curated `relatedSlugs` list on each tool in `tools.ts`, replacing the earlier arbitrary positional rotation from Phase 5.5. Homepage also links out to `/privacy` and `/about`.
  - **`/sitemap.xml`** and **`/robots.txt`** ([sitemap.ts](src/app/sitemap.ts), [robots.ts](src/app/robots.ts)): sitemap lists the homepage, all 8 tool pages, and the 4 legal/info pages — no `/api/` URLs, no fabricated `lastModified` dates. robots.txt allows everything except `/api/` and points at the sitemap.
  - **Uploaded files/processing URLs can't be indexed**: `/api/` is disallowed in robots.txt *and* every `/api/*` response carries `X-Robots-Tag: noindex, nofollow` (see [next.config.ts](next.config.ts)) — belt-and-suspenders, since a disallowed-but-linked URL can still get indexed without ever being crawled.
  - **OG image**: [opengraph-image.tsx](src/app/opengraph-image.tsx) generates a real 1200×630 PNG via `next/og`'s `ImageResponse` at request time — one shared image, explicitly referenced by every page's `openGraph.images`/`twitter.images` (a page-level `openGraph` object suppresses Next's own ancestor-fallback for file-convention images, so this has to be explicit rather than automatic).
  - Verified live against a real production build: correct `<title>`/canonical/OG/Twitter tags and all expected `@type` values (`WebSite`, `SoftwareApplication`, `BreadcrumbList`, `FAQPage`) on real rendered pages, not just unit-tested in isolation.
  - 173 unit tests (24 new — tools registry integrity, structured data shape, metadata builders, sitemap/robots content), 128 e2e tests (unchanged pass count, verified no regressions from the new on-page content), lint, typecheck, and a production build all green.
- **Phase 7 — Polish, performance, mobile QA**: Lighthouse/performance pass, edge-case handling (corrupted/encrypted PDFs, oversized files). *(Cross-device responsiveness and the accessibility pass are substantially covered by Phase 5.5 above.)*
- **Phase 7.5 — Security & privacy hardening** ✅ *done*: a full audit of the security requirements above, plus:
  - **Per-IP rate limiting** ([rateLimit.ts](src/lib/security/rateLimit.ts)): a simple in-memory sliding-window limiter (20 requests/5 min per IP across all 8 processing endpoints combined — sharing one bucket per IP so a client can't dodge the limit by spreading requests across tools; 60/5 min for the read-only download route), wired into every route via `rateLimitResponse()` in [apiHelpers.ts](src/lib/processing/apiHelpers.ts), 429 + `Retry-After` on the limit, periodic bucket sweep started from `instrumentation.ts` alongside the existing temp-file cleanup sweep. Disabled only via `GOATPDF_DISABLE_RATE_LIMIT=1`, set solely in `playwright.config.ts`'s `webServer.env` — every e2e request comes from one loopback connection with no `x-forwarded-for`, so real limiting would collapse the whole suite into a single bucket; never set in a real deployment.
  - **Security headers** ([next.config.ts](next.config.ts)): CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`, applied to every route via `headers()`. The CSP's `script-src` and `style-src` both keep `'unsafe-inline'` — a deliberate, documented trade-off (see the comment above `CONTENT_SECURITY_POLICY`): the App Router injects its own inline hydration scripts on every page, and a correctly nonce'd CSP would require forcing every route (including the currently-static marketing/tool pages) into per-request dynamic rendering, which this pass didn't do. There's no known script-injection vector in the app to exploit via this — no unsanitized user content is ever rendered as markup; the one `dangerouslySetInnerHTML` in the codebase ([JsonLd.tsx](src/components/JsonLd.tsx), added in Phase 6) renders only static, developer-authored JSON-LD, never user input. No `Access-Control-Allow-Origin` is set anywhere, which is what actually keeps `/api/*` responses unreadable from another origin.
  - **Closed a combined-upload-size gap**: `jpgToPdf.ts` had no cap on the combined size of a multi-image batch (unlike `mergePdf.ts`'s existing 200 MB combined check) — added the same `assertCombinedSizeWithinLimit` pattern there too.
  - **Static pages**: `/privacy`, `/terms`, `/about`, `/contact` ([LegalPageLayout.tsx](src/components/legal/LegalPageLayout.tsx) + one page each), linked from the footer. The Privacy Policy is written to describe the actual implementation only (temp-file TTL/sweep timing, exactly what's logged, IP handling for rate limiting, no cookies/accounts) — it makes no claim the code doesn't back up. *(Its "no analytics" claim was accurate at the time — see Phase 9 below, which added optional analytics and updated this page accordingly.)*
  - Verified everything else in the security-requirements checklist above was already true from earlier phases (private per-job storage, single-use download links, random UUIDs, server-side magic-byte validation, path-traversal guards, processing timeouts, safe generic error messages, structurally-narrow logging).
  - Full suite green throughout: 149 unit tests (17 new — rate limiting, CSP header configuration, jpg-to-pdf combined-size), 128 e2e tests (2 new — static pages, live security-header assertions), lint, typecheck, and a production build.
  - **Not done here** (still Phase 8 below): a dependency audit, a dedicated cleanup-mechanism stress test, and the Dockerfile/deployment itself.
- **Phase 9 — Analytics** ✅ *done*: privacy-conscious, off-by-default usage analytics.
  - **Event taxonomy** ([events.ts](src/lib/analytics/events.ts)): exactly `page_view`, `tool_view`, `file_upload`, `processing_started`, `processing_completed`, `processing_failed`, `download_completed` — structurally narrow like `logger.ts`'s `JobLogEvent`, so an event can only ever carry `{ name, tool?, path? }`. There is no field for a filename or file content anywhere in the type, so no call site can leak either by accident.
  - **Off by default, configured entirely through server env vars** ([track.ts](src/lib/analytics/track.ts)): `ANALYTICS_ENABLED=true` turns it on at all; `ANALYTICS_ENDPOINT_URL` optionally forwards each event as a plain JSON POST to any collector that accepts one (a self-hosted Plausible/Umami instance, a custom collector) — provider-agnostic by design, so this app doesn't depend on a specific vendor's SDK or need a third-party script added to the CSP `script-src` allow-list; `ANALYTICS_SITE_ID` is included in the forwarded payload when the collector needs one. With no endpoint configured, enabling analytics just logs events to the server's own console (same pattern as `logJobEvent`).
  - **Client events never reach a third party directly**: `page_view`/`tool_view` (fired by [AnalyticsPageView.tsx](src/components/analytics/AnalyticsPageView.tsx), mounted once in the root layout) and `file_upload` (fired by `UploadZone` via its new optional `toolSlug` prop, once per successful validation) go through [trackClientEvent.ts](src/lib/analytics/trackClientEvent.ts) → this app's own `POST /api/analytics` first. That route validates against `parseClientAnalyticsEvent()` (rejects any event name outside the 3 client-safe ones — so a script in the browser console can't forge a `processing_completed`/`download_completed` — plus any tool slug that isn't real and any implausible path) before calling `trackEvent()`, and is rate-limited (120 req/5 min/IP) via the existing `rateLimitResponse()`.
  - **Server lifecycle events** (`processing_started`/`completed`/`failed`, `download_completed`) are fired directly from [runProcessingJob.ts](src/lib/processing/runProcessingJob.ts) (alongside the existing `logJobEvent` calls, including the early `TOO_FEW_FILES`/`TOO_MANY_FILES`/`VALIDATION_FAILED` rejections that happen before a job workspace even exists) and the [download route](src/app/api/download/[id]/route.ts). `buildJobResponse()` now takes a `toolId` argument (each of the 8 routes passes its own literal tool id) purely so the job registry can carry `toolId` through to the download route, which has no other way to know which tool produced a given download.
  - **Visitor IP is forwarded, not stored**: when an event originates from a real request (a client event via `/api/analytics`, or a download), the visitor's IP (via the same `clientIpFromRequest()` now shared with rate limiting — extracted into [clientIp.ts](src/lib/security/clientIp.ts)) is passed as `X-Forwarded-For` on the *outbound* request to the configured collector only, so the collector's own privacy-conscious (non-cookie) unique-visitor counting still works through a server-side proxy — GOAT PDF itself never logs or stores it. Processing lifecycle events (which don't have a `Request` object naturally in scope) don't carry IP forwarding — a deliberate, documented scope boundary rather than an oversight.
  - **Privacy Policy updated accordingly** — Phase 7.5's "no analytics currently" claim is now replaced with a dedicated Analytics section listing exactly what's tracked, confirming it's off by default, and explaining the client-proxy/IP-forwarding design in plain language.
  - Verified live, not just unit-tested: a real Playwright browser test intercepts the actual network request and confirms visiting a tool page fires `page_view` + `tool_view` with the right path/tool, and that adding a file fires `file_upload` containing the tool name and **provably not** the filename.
  - 196 unit tests (23 new — event validation, enabled/disabled/forwarding behavior, IP-header forwarding), 142 e2e tests (14 new — `/api/analytics` accept/reject cases plus the two live-network-interception checks above), lint, typecheck, and a production build all green.
- **Phase 8 — Pre-launch**: dependency audit, cleanup mechanism stress test, full E2E pass across all 8 tools, **write the Dockerfile (with LibreOffice installed)**, deploy to the Docker PaaS, production smoke test.

AdSense integration is explicitly **out of scope** for all of the above phases and will be scoped separately after MVP launch.

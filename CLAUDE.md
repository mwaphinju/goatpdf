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
        compress-pdf/page.tsx
        merge-pdf/page.tsx           # real tool — MergePdfTool, not the shared placeholder shell
        split-pdf/page.tsx
        rotate-pdf/page.tsx
        delete-pages/page.tsx
        jpg-to-pdf/page.tsx
        pdf-to-jpg/page.tsx
        pdf-to-word/page.tsx
      api/
        merge-pdf/route.ts           # POST — the only real tool route so far
        download/[id]/route.ts       # GET — single-use, in-memory-registry-backed file download
        compress/route.ts            # not yet added
        split/route.ts               # not yet added
        rotate/route.ts              # not yet added
        delete-pages/route.ts        # not yet added
        jpg-to-pdf/route.ts          # not yet added
        pdf-to-jpg/route.ts          # not yet added
        pdf-to-word/route.ts         # not yet added
      sitemap.ts                    # not yet added — Phase 6
      robots.ts                     # not yet added — Phase 6
    components/
      layout/                       # Header.tsx, Footer.tsx
      ui/                           # Button.tsx, UploadZone.tsx, ErrorMessage.tsx, ProcessingState.tsx, ResultDownload.tsx
      tools/
        ToolPageLayout.tsx           # shared heading/description wrapper, used by all 8 tool pages
        ToolPageShell.tsx            # the generic "coming soon" shell — still used by the 7 unimplemented tools
        MergePdfTool.tsx             # merge-pdf's real, dedicated UI: add/remove/reorder files, real upload, processing/success/error states
      ToolCard.tsx
      icons.tsx                     # hand-written inline SVG icons — no icon library dependency
    lib/
      tools.ts                      # the 8-tool registry (slug, name, description, accept type, icon) — drives nav, homepage, footer, and routes
      cn.ts                         # tiny classname-join helper (no clsx/tailwind-merge dependency)
      format.ts                     # formatBytes — unit-tested
      files/
        validate.ts                  # size/extension/MIME/magic-byte validation, filename sanitization
        tempStorage.ts                # random-UUID job workspaces, traversal-guarded read/write/remove
        cleanup.ts                   # TTL sweep + startCleanupScheduler(), run from instrumentation.ts
      processing/
        types.ts                     # ToolId, ToolConfig, ToolProcessor, ProcessingContext/-Result
        toolConfigs.ts                # the 8 tools' validation rules — merge-pdf now points at the real mergePdf processor, the other 7 still throw NOT_IMPLEMENTED
        runProcessingJob.ts           # shared orchestrator: validate → stage → run processor w/ timeout → cleanup on failure
        jobRegistry.ts                # in-memory jobId → output-file map backing the single-use download route
        timeout.ts                   # withTimeout() — races a processor against its configured timeout
        errors.ts                    # ProcessingJobError hierarchy — safe code+message, never raw internals
        logger.ts                    # logJobEvent() — structurally cannot accept file content, only {jobId, toolId, event, ...}
      pdf/
        mergePdf.ts                  # real pdf-lib merge implementation — the only implemented tool so far
    types/
  instrumentation.ts                # Next.js server-startup hook — starts the cleanup scheduler
  tests/
    unit/
      format.test.ts
      files/                        # validate, tempStorage (incl. traversal-protection tests), cleanup
      processing/                   # runProcessingJob.test.ts — valid/invalid/oversized/timeout/error/no-content-logging
      pdf/                          # mergePdf.test.ts — page order, corrupted-file handling, combined-size limit
    e2e/                            # Playwright — homepage, navigation, tool-pages, merge-pdf (full user flow), fixtures/
```

Each tool's UI page and its `lib/pdf/*` function should be independently understandable — a future contributor should be able to read one tool's code without needing to understand the other seven.

**Current status:** Merge PDF is the first fully working tool — real upload, pdf-lib merge, single-use download, and full Playwright coverage of the user flow. The other 7 tools are still placeholders: their `toolConfigs.ts` processor throws `NOT_IMPLEMENTED` and their page still shows the shared "coming soon" `ToolPageShell`. `lib/pdf/*` (per-tool logic) and `api/*/route.ts` (HTTP wiring) now exist as a working pattern for merge-pdf that the remaining 7 tools can each follow. Not yet built: the Dockerfile, `sitemap.ts`/`robots.ts`, and rate limiting / security headers (planned for Phase 8).

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
- **Phase 1 — Core file pipeline** ✅ *done*: reusable Button, UploadZone, ErrorMessage, ProcessingState, ResultDownload components; server-side validation (size, extension, MIME, magic-byte sniffing), filename sanitization, temp workspaces under random UUIDs with traversal guards, TTL-based cleanup sweep wired to server startup via `instrumentation.ts`, a shared `runProcessingJob` orchestrator, and the `api/merge-pdf` + `api/download/[id]` HTTP route handlers (single-use, in-memory-registry-backed downloads). **Not yet done:** the Dockerfile (needed before any real deploy) — everything else in this phase is complete and proven end-to-end by Merge PDF below.
- **Phase 2 — Core pdf-lib tools**: split by tool.
  - **Merge PDF** ✅ *done*: real pdf-lib implementation ([mergePdf.ts](src/lib/pdf/mergePdf.ts)), dedicated UI ([MergePdfTool.tsx](src/components/tools/MergePdfTool.tsx)) with add/remove/reorder (buttons + native drag-and-drop)/merge/download/start-over, corrupted-file and combined-size-limit handling, unit tests, and full Playwright coverage of the user flow.
  - **Split PDF, Delete PDF Pages** ⬜ *not started* (Rotate PDF was originally scoped here too, but is still an unimplemented placeholder — move it here or to its own phase when it's picked up).
- **Phase 3 — Image tools**: JPG to PDF, PDF to JPG.
- **Phase 4 — Compress PDF**: pdf-lib + sharp image re-encode/downsample pipeline.
- **Phase 5 — PDF to Word**: LibreOffice headless integration, Dockerfile finalized with LibreOffice installed, conversion failure handling.
- **Phase 6 — SEO & content**: per-tool metadata, sitemap, robots.txt, structured data, real explanatory copy per tool page, OG images.
- **Phase 7 — Polish, performance, mobile QA**: cross-device responsiveness pass, Lighthouse/performance pass, accessibility pass, edge-case handling (corrupted/encrypted PDFs, oversized files).
- **Phase 8 — Security hardening & pre-launch**: rate limiting, security headers, dependency audit, cleanup mechanism stress test, full E2E pass across all 8 tools, deploy to the Docker PaaS, production smoke test.

AdSense integration is explicitly **out of scope** for all of the above phases and will be scoped separately after MVP launch.

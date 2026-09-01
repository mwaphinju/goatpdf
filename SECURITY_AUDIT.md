# GOAT PDF — Security Audit: File Upload & PDF Processing System

**Date:** 2026-09-01
**Scope:** the full upload → validate → stage → process → download → cleanup pipeline shared by all 8 tools. Specifically: user uploads, temporary storage, generated files, downloads, file naming, path traversal, MIME validation, extension validation, file size limits, malformed files, processing timeouts, memory/resource exhaustion, cleanup after success, cleanup after failure, cleanup of abandoned files, unauthorized file access.
**Method:** direct source review of every file in the pipeline (`src/lib/files/*`, `src/lib/processing/*`, `src/lib/security/*`, all 8 `src/app/api/*/route.ts` + the download route, `src/lib/pdf/pdfToWord.ts`'s child-process handling, `next.config.ts`'s headers, `instrumentation.ts`'s scheduler wiring), cross-checked against live production behavior already verified in [WEEK1_QA_REPORT.md](WEEK1_QA_REPORT.md), plus one external verification (Render's actual `X-Forwarded-For` behavior, checked against Render's own team statement rather than assumed). No new features added.

---

## Summary

| Severity | Count | Fixed this pass |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 2 | 2 |
| MEDIUM | 1 | 0 (documented, requires an architecture change) |
| LOW | 1 | 1 |

The core pipeline is well-built: random-UUID-only file naming, a filesystem root guard (`assertInsideTempRoot`) that makes path traversal structurally impossible rather than merely filtered, magic-byte validation on top of extension/MIME checks, single-use in-memory download tokens, and 0600/0700 file permissions were all already in place and are confirmed correct. The two HIGH findings fixed here are both about **cleanup and resource bookkeeping that had no sweep at all**, not about an attacker being able to read/write/traverse anything they shouldn't.

---

## Findings

### SEC-A — HIGH (fixed): in-memory job registry never expired

**Area:** memory/resource exhaustion, cleanup of abandoned files

`src/lib/processing/jobRegistry.ts` maps a completed job's id to its output file in a plain in-memory `Map`, with no TTL. `src/instrumentation.ts` starts exactly two periodic sweeps on server boot — the workspace-directory cleanup (`files/cleanup.ts`) and the rate-limit bucket cleanup (`security/rateLimit.ts`) — and nothing else. There was no code path that ever removed a registry entry other than a real download (`consumeJobOutput`, single-use).

**Impact:** any job that completes but is never downloaded — an abandoned browser tab, a dropped connection, a bot that uploads but never fetches the result — leaves a permanent entry in memory for the life of the process. This is unbounded: nothing caps how many distinct jobs can accumulate over time (rate limiting bounds requests *per IP per 5 minutes*, not total registry size), so sustained organic traffic or a trivial abuse script (hit any processing endpoint repeatedly, never call the returned `downloadUrl`) grows memory without bound on a Render free-tier instance already constrained to 512MB RAM. Separately, once `files/cleanup.ts`'s existing 1-hour sweep deletes the on-disk workspace for an abandoned job, the registry entry pointing at that now-deleted file became stale — harmless today only because the download route already handles a missing file gracefully (caught, returns 404), but it's a correctness gap, not a designed behavior.

**Fix applied:**
- `jobRegistry.ts`: added a `registeredAt` timestamp captured internally on `registerJobOutput`, and a new `sweepExpiredJobOutputs(ttlMs, now)` export that deletes entries older than `ttlMs` — the exact same shape as `files/cleanup.ts`'s existing `sweepExpiredWorkspaces`. `consumeJobOutput`'s return shape is unchanged (the internal `registeredAt` field is stripped before the entry is returned, so nothing downstream — the download route, analytics — sees a new field).
- `files/cleanup.ts`: the existing periodic sweep now also calls `sweepExpiredJobOutputs(JOB_TTL_MS)` on every tick, using the same 1-hour TTL as the workspace sweep, so a registry entry and the on-disk file it points to expire together. No new scheduler was added — this rides the existing interval already wired up in `instrumentation.ts`, so no architecture change.
- New tests: `tests/unit/processing/jobRegistry.test.ts` (sweep removes expired entries, leaves fresh ones, single-use semantics, a swept entry can't later be consumed).

### SEC-B — HIGH (fixed): an output-file read failure inside `buildJobResponse` skipped cleanup

**Area:** cleanup after failure

`src/lib/processing/apiHelpers.ts`'s `buildJobResponse` — called directly by all 8 route handlers with no surrounding try/catch — called `await fs.stat(output.path)` unguarded. `runProcessingJob`'s own failure handling (which does clean up the workspace) has already run and returned by this point; `buildJobResponse` only had an explicit cleanup path for the case where a processor's `outputs` array is empty, not for the case where an output entry exists but the file it claims to point to isn't actually readable. If a processor ever reported success with an output path that wasn't genuinely written (a processor-side bug, not something external input can trigger given every processor writes via the already-guarded `writeWorkspaceFile`), the exception would propagate uncaught out of the route handler, and — critically — the job workspace would never be removed, leaking a directory until the next TTL sweep.

**Fix applied:** wrapped the `fs.stat` call in a try/catch; on failure it now removes the workspace (matching the existing empty-`outputs` branch immediately above it) and returns the same safe, generic `PROCESSING_FAILED` response instead of throwing. New test: `tests/unit/processing/apiHelpers.test.ts` covers both the normal-success path and this failure path (asserts the workspace is actually gone from disk afterward).

### SEC-C — MEDIUM (documented, not fixed — requires an architecture change)

**Area:** processing timeouts, memory/resource exhaustion

`src/lib/processing/timeout.ts`'s `withTimeout()` races a processor's promise against a timer with `Promise.race`. When the timer wins, the original promise is abandoned, not cancelled — the underlying work keeps running. Of the 8 processors, only `pdfToWord.ts` actually kills its own work on timeout, because it shells out to LibreOffice via `execFile`'s own `timeout` option, which sends the child process a real `SIGTERM`. The other 7 processors — most notably `compressPdf.ts` (sharp re-encoding) and `pdfToJpg.ts` (pdfjs-dist + `@napi-rs/canvas` rasterization), the two most CPU/memory-intensive besides Word — have no cancellation path at all. If one of those hangs or simply runs long, `runProcessingJob` reports a timeout, deletes the job's workspace directory, and moves on — but the orphaned native work continues consuming CPU and RAM in the background until it finishes or errors on its own.

**Why not fixed here:** a correct fix requires genuine cancellation of native/CPU-bound work — moving `sharp`/`@napi-rs/canvas` calls into a worker thread or a separate child process that can be forcibly terminated on timeout. That changes how processing is structured (a real isolation boundary that doesn't exist today), which is explicitly out of scope for this pass ("fix only issues that can be safely fixed without changing the product architecture"). Recorded here rather than silently left out, since it's a genuine resource-exhaustion path: on a 512MB RAM / 0.1 CPU Render free-tier instance, several concurrent slow/adversarial `pdf-to-jpg` or `compress-pdf` requests (up to the rate limiter's 20-per-5-minutes-per-IP ceiling) could each be reported as "timed out" to the client while still running for real underneath, compounding load rather than actually shedding it.

**Recommended follow-up (not implemented):** either move the two heaviest processors' native work off the main event loop into cancellable workers, or — as a smaller interim step with no architecture change — lower `compress-pdf`'s and `pdf-to-jpg`'s `timeoutMs` values and/or cap concurrent in-flight jobs per process, to shrink the exposure window rather than eliminate it.

### SEC-D — LOW (reviewed, confirmed correct — no fix needed): `X-Forwarded-For` trust

**Area:** unauthorized file access / rate-limit integrity

`src/lib/security/clientIp.ts` derives the rate-limiting bucket key from the *first* entry of `X-Forwarded-For`. On the general web this is a well-known anti-pattern — if a client can set their own `X-Forwarded-For` header and a proxy merely *appends* rather than replacing it, the first entry is attacker-controlled, and taking it as "the real client IP" makes per-IP rate limiting trivially bypassable (spoof a new fake IP on every request). This looked like a plausible HIGH/CRITICAL finding and was investigated directly rather than assumed either way.

Verified against Render's own platform behavior (Render is this app's actual, sole deployment target) via Render's public feedback tracker: a Render team member confirmed directly that **Render places the real, edge-verified client IP first** in `X-Forwarded-For`, specifically to close this exact spoofing concern, regardless of what a client sends. Given that confirmation, taking the first entry is correct for this app's actual deployment target, and no change was made. Recorded here so this is documented as *checked*, not overlooked — if the app is ever deployed behind different infrastructure that doesn't provide the same guarantee, this file is the one to revisit first.

---

## Checklist: reviewed, no issue found

These areas were part of the requested scope and were reviewed in depth but had no CRITICAL/HIGH finding — noted here so the audit's coverage is explicit rather than implied by omission.

- **Path traversal** — `files/tempStorage.ts`'s `assertInsideTempRoot()` resolves every path and requires it to start with `root + path.sep` (not just `root`, which would incorrectly allow a sibling directory like `goatpdf-evil` to pass a naive prefix check) before any read/write/delete. Combined with the fact that no user input ever reaches a filesystem path — all on-disk names are `crypto.randomUUID()`-generated — traversal is structurally prevented, not just filtered.
- **File naming** — `sanitizeFileName()` strips to a `[a-zA-Z0-9 ._()-]` allow-list after stripping control characters and any directory component; this sanitized name is used only for display/labeling and to derive an extension, never to construct a path directly. Every on-disk file uses `randomFileName()` (a fresh UUID) regardless of what the user uploaded.
- **MIME / extension validation** — `files/validate.ts` requires reported extension, reported MIME type, *and* an authoritative magic-byte sniff of the actual bytes to all agree with the tool's accepted-kinds allow-list; live-tested this session (WEEK1_QA_REPORT.md) with a JPEG renamed to `.pdf`, correctly rejected with `CONTENT_TYPE_MISMATCH`.
- **File size limits** — 50MB per file (`MAX_FILE_SIZE_BYTES`), 200MB combined per job (`runProcessingJob.ts`), both checked before any workspace is created or bytes are written to disk (this ordering was itself a prior audit fix — see `MVP_AUDIT.md`'s SEC-1).
- **Malformed files** — `loadPdfOrThrow()` wraps both `PDFDocument.load()` and the first page-tree access in one try/catch (pdf-lib can parse a structurally broken PDF "successfully" and only throw once its page tree is touched), converting any failure into the same safe `UnreadableFileError` used for encrypted/password-protected PDFs (pdf-lib's default `ignoreEncryption: false` is relied on, not overridden).
- **Unauthorized file access** — the temp root lives under the OS temp directory, entirely outside `public/`'s static-serving root, so nothing in it is ever reachable except through the single-use, random-UUID-keyed download route; confirmed live that an unknown or already-used job id returns 404 with the same security headers as every other response (no information-leaking difference in behavior).
- **Child-process safety** (`pdfToWord.ts`) — LibreOffice is invoked via `execFile` with an argument array, never a shell string; the input file path is never interpolated into a shell command. Confirmed this is the only `child_process` usage anywhere in `src/`.
- **Cleanup after success** — the download route's `finally` block removes the job workspace unconditionally, whether the read succeeded or the file was already gone.
- **Cleanup after failure** — `runProcessingJob.ts`'s catch block removes the workspace on any processor error, including timeouts.
- **Cleanup of abandoned files** — `files/cleanup.ts`'s 1-hour TTL sweep (workspaces) now has a matching counterpart for registry entries (SEC-A above).

---

## Verification

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run test` (unit) — **181/181 passing** across 22 test files (174 before this pass + 7 new: `jobRegistry.test.ts` ×5, `apiHelpers.test.ts` ×2). 2 files (`tests/unit/pdf/pdfToJpg.test.ts`, `tests/unit/processing/runProcessingJob.test.ts`) still fail to *load* on this machine due to a pre-existing local Windows Application Control policy blocking `@napi-rs/canvas`'s native binary — unrelated to these changes (documented in `WEEK1_QA_REPORT.md`'s QA-1; same failure existed before any file in this audit was touched). Neither of the two files this audit modified live in that blocked import chain.
- `npm run build` — **could not be re-verified locally** for the same reason (QA-1): the production build transitively imports `@napi-rs/canvas` while collecting page data, which this machine's OS currently blocks from loading at all. This is an unresolved local-environment issue flagged in `WEEK1_QA_REPORT.md`, not something introduced or worsened by this pass. The three changed files are plain TypeScript with no new dependencies and pass a clean `tsc --noEmit`, so build risk from these specific changes is low, but this has not been proven with a real build the way every other change in this project has been.

## Files changed

- `src/lib/processing/jobRegistry.ts` — added TTL sweep (SEC-A)
- `src/lib/files/cleanup.ts` — wired the new sweep into the existing scheduler (SEC-A)
- `src/lib/processing/apiHelpers.ts` — guard + cleanup around `fs.stat` (SEC-B)
- `tests/unit/processing/jobRegistry.test.ts` — new
- `tests/unit/processing/apiHelpers.test.ts` — new

No other files were changed. No new dependencies were added. No product features were added or changed. **Nothing was deployed** — all changes are local/committed only, per instructions.

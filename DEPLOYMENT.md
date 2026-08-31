# GOAT PDF — Production Deployment Readiness Review

**Date:** August 31, 2026
**Commit reviewed:** `a7c8be0`
**Scope:** environment variables, build configuration, production scripts, security headers, file processing requirements, temporary storage requirements, cleanup mechanism, domain configuration requirements — plus a consolidated checklist.

**This is a review and planning document only.** No Dockerfile has been written and no deployment has been performed. Per instruction, deployment does not happen automatically from this document — see "What this document does *not* do" at the end.

---

## 1. Environment variables

Every `process.env.*` read in the app (excluding test-only usage), what it defaults to, and what it's for:

| Variable | Required? | Default if unset | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Should be set** | `https://goatpdf.app` (placeholder) | Base URL for canonical links, Open Graph/Twitter tags, `sitemap.xml`, `robots.txt`. If left unset in production, every one of these will silently point at a domain the app doesn't actually own. |
| `SOFFICE_PATH` | No (Linux/Docker) | Falls back to Windows install paths, then bare `soffice` on `$PATH` | Path to the LibreOffice binary. On Linux the fallback to bare `soffice` is correct **only if LibreOffice is installed and on `PATH`** — see Section 5. |
| `GOATPDF_TEMP_ROOT` | No | `os.tmpdir()/goatpdf` | Root directory for per-job temp workspaces. The OS default is fine in a container; see Section 6. |
| `ANALYTICS_ENABLED` | No | Off (must be exactly the string `"true"`) | Master switch for the optional analytics layer (Phase 12). Safe by default — nothing is tracked unless explicitly turned on. |
| `ANALYTICS_ENDPOINT_URL` | No | Unset (console-log only if `ANALYTICS_ENABLED=true`) | Where to forward analytics events, if enabled. |
| `ANALYTICS_SITE_ID` | No | Unset | Site identifier included in forwarded analytics events, if a collector needs one. |
| `GOATPDF_DISABLE_RATE_LIMIT` | **Must never be set in production** | Unset (rate limiting active) | Test-only escape hatch, set solely in `playwright.config.ts`'s `webServer.env` for the e2e suite. If this ever leaks into a real deployment's environment, rate limiting silently no-ops. |
| `NEXT_RUNTIME` | Set automatically by Next.js | — | Not user-configured; gates `instrumentation.ts`'s startup hook to the Node.js runtime. |
| `CI` | No (build tooling only) | Unset | Only read by `playwright.config.ts`; irrelevant to the deployed app itself. |

**No `.env.example` file exists in the repo.** Recommend adding one (documenting the variables above, with `GOATPDF_DISABLE_RATE_LIMIT` conspicuously *not* listed as something to copy) so a deployer isn't left guessing.

**Nothing in this app currently requires a secret.** There's no database credential, no API key, no auth secret — the only "sensitive" configuration is `ANALYTICS_ENDPOINT_URL`/`ANALYTICS_SITE_ID` if analytics is enabled, and neither is a credential.

---

## 2. Build configuration

`next.config.ts` and `package.json` reviewed directly.

- **No `output: "standalone"` is set.** This is the standard recommendation for Docker deployments (produces a minimal `.next/standalone` folder with only the `node_modules` files Next's tracer determines are actually needed, instead of shipping the full `node_modules`). **Do not adopt this blindly** — see the pdfjs-dist finding in Section 5; it would silently break PDF rendering unless handled explicitly.
- `serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"]` is already correctly configured so these native/asset-heavy packages are `require()`'d from `node_modules` at runtime instead of bundled — this is necessary and already correct.
- `allowedDevOrigins` is dev-only (LAN testing) and has zero effect on `next build`/`next start` — no action needed.
- `package-lock.json` **is committed** — good, means the Docker build can (and should) use `npm ci` for a reproducible install rather than `npm install`.
- No `engines` field in `package.json` pinning a Node version. The dev environment runs Node 24; `@types/node` is pinned to `^20`. Recommend explicitly choosing and pinning a Node LTS version (20 or 22) for the Docker base image rather than leaving it implicit.
- **No `Dockerfile` and no `.dockerignore` exist in the repo yet.** This is the single largest gap standing between this app and an actual deployment — see the checklist.

---

## 3. Production scripts

`package.json`'s `scripts` block:

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:e2e": "playwright test"
```

- `build` / `start` are the standard Next.js production pair — correct, no changes needed.
- `next start` respects the `PORT` environment variable automatically (falls back to 3000 if unset) — this matches how most PaaS platforms (Render, Railway, Fly.io) inject a dynamic port, so **no code change is needed here**, but it should be explicitly verified against whichever platform is chosen (some platforms expect the app to bind `0.0.0.0`, which is Next's default; worth a smoke-test rather than an assumption).
- There is no dedicated health-check route (e.g. `/api/health`). Not a hard blocker — the homepage (`/`) is a static 200 response and works as a basic liveness target — but a lightweight dedicated endpoint is a common PaaS convention worth adding if the target platform expects one.
- `lint`/`typecheck`/`test`/`test:e2e` are dev/CI-only — not part of the deployed image, but should gate the deploy (see checklist item under CI).

---

## 4. Security headers

`next.config.ts`'s `headers()` — re-confirmed present and unchanged since the MVP audit:

| Header | Value | Status |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...; frame-ancestors 'none'` | Present. `'unsafe-inline'` on `script-src`/`style-src` is a documented, deliberate trade-off (App Router's own inline hydration scripts) — see the MVP audit's SEC-2. |
| `X-Content-Type-Options` | `nosniff` | Present |
| `X-Frame-Options` | `DENY` | Present |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Present |
| `Permissions-Policy` | camera/microphone/geolocation/payment/usb all denied | Present |
| `Cross-Origin-Opener-Policy` | `same-origin` | Present |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Present, **but only effective if the deployment actually terminates HTTPS** — see Section 8. Sending HSTS over plain HTTP has no effect and isn't harmful, but the platform must genuinely serve HTTPS for this header to do anything. |
| `X-Robots-Tag: noindex, nofollow` on `/api/*` | Present | Confirmed applied only to API routes, not pages. |

No CORS headers (`Access-Control-Allow-Origin`) are set anywhere — this is intentional and correct; it's what keeps `/api/*` responses unreadable from any other origin.

**No changes needed here for deployment** — this area is already production-ready and was independently verified live in the MVP audit and the subsequent fix pass.

---

## 5. File processing requirements

This is the area with the most real deployment risk. Three native/external dependencies:

### LibreOffice (PDF to Word)
- `pdfToWord.ts` resolves the binary via `SOFFICE_PATH` → Windows install paths → bare `soffice` on `$PATH`. **On Linux/Docker, this means LibreOffice must be installed in the image and `soffice` must be on `$PATH`** — there is no bundled fallback.
- LibreOffice is a large install (several hundred MB). This is the dominant factor in final image size — expect it to dwarf every other dependency combined.
- The critical, easy-to-get-wrong detail (documented in `CLAUDE.md` from Phase 8): the conversion command **must** include `--infilter=writer_pdf_import`, or LibreOffice imports the PDF into Draw instead of Writer, and Draw has no DOCX export filter at all. This is already correctly implemented in code — nothing to fix, just something to know if PDF to Word ever silently starts failing after an image rebuild.
- LibreOffice needs a writable per-job profile directory (`-env:UserInstallation=...`), which the code already creates inside each job's own temp workspace — no shared/global LibreOffice state, so concurrent conversions are already safe.

### sharp (Compress PDF, PDF to JPG rendering pipeline's re-encoding)
- Ships prebuilt native binaries selected by platform/libc at install time. **The `npm install`/`npm ci` step must run *inside* the Docker build, targeting the container's actual OS/architecture** — never `COPY` a `node_modules` directory installed on the host (macOS/Windows) into the image; the binaries won't match and sharp will fail to load at runtime.
- Works on both Debian-based and Alpine (musl) images, but Alpine sometimes needs extra flags/newer sharp versions to get prebuilt binaries instead of falling back to a slow from-source compile. Combined with the LibreOffice requirement below, a **Debian-based image (e.g. `node:20-slim` / `node:20-bookworm-slim`) is the safer default**, not Alpine.

### @napi-rs/canvas + pdfjs-dist (PDF to JPG rendering)
- `@napi-rs/canvas` also ships prebuilt native binaries — same "install inside the container" requirement as sharp.
- **Concrete, non-obvious risk found in this review:** `pdfRenderer.ts` resolves pdfjs-dist's standard-font and CJK cmap data files via a runtime-constructed path — `path.join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts")` (and `cmaps`). This is a plain string path, not an `import`/`require`, so **Next.js's `output: "standalone"` file tracer cannot see it and will not include those asset directories** in the pruned `node_modules` it produces. If a Dockerfile adopts `standalone` output (a very common "best practice" copy-paste for Next.js Docker deployments) without accounting for this, PDF to JPG will build and start successfully but silently render pages with missing/incorrect fonts for any PDF that relies on standard font substitution — likely most real-world PDFs, not just contrived edge cases.
  - **Recommendation:** either skip `output: "standalone"` entirely (simpler; keep the full `node_modules` in the final image, which is fine for a hobby/MVP-scale deployment) — or, if image size matters enough to use `standalone`, add an explicit `COPY --from=builder /app/node_modules/pdfjs-dist/standard_fonts ...` (and `cmaps`) step after the standalone copy, and add a test/smoke-check that actually renders a PDF containing non-embedded standard fonts before trusting the image.

### Combined implication for the base image
Given LibreOffice's Linux packaging is far more reliable on Debian/Ubuntu than Alpine, and sharp/`@napi-rs/canvas` both work cleanly on Debian, **the Dockerfile should use a Debian-based Node image**, not Alpine, despite Alpine's smaller base size.

---

## 6. Temporary storage requirements

- Job files live under `GOATPDF_TEMP_ROOT` (default `os.tmpdir()/goatpdf`) — created with `mode: 0o700`, individual files with `mode: 0o600`.
- **No persistent volume should be attached to this path.** The design is explicitly built around ephemeral storage — every file is deleted either immediately after download or by the 15-minute sweep (60-minute TTL). A persistent volume would be actively wrong here: it adds cost/complexity for zero benefit, and in a multi-replica scenario (see Section 7) could accumulate orphaned files across restarts in ways nothing is designed to reconcile.
- **Disk space sizing:** worst case for a single in-flight job is bounded by each tool's own limits — up to 200 MB combined for merge-pdf/jpg-to-pdf, up to 50 MB for any single-file tool. Multiply by the number of concurrent jobs you expect to size the container's writable layer/`/tmp` — a few GB of headroom is comfortable for a low-traffic MVP launch.
- The container's filesystem being ephemeral across restarts (the Docker default, no volume) is **correct and desired** here, not a gap to fix.

---

## 7. Cleanup mechanism

- `instrumentation.ts`'s `register()` hook starts both the temp-file sweep (`startCleanupScheduler`, every 15 min, 60-min TTL) and the rate-limit bucket sweep, gated on `process.env.NEXT_RUNTIME === "nodejs"`.
- Next.js's instrumentation hook is **stable by default in Next 15+** (this app runs 16.3.3) — no `experimental.instrumentationHook` config flag is needed; it will run automatically under `next start` in the container with zero extra configuration.
- **Architecturally significant constraint, worth flagging prominently:** cleanup, the job registry (`jobRegistry.ts`), and rate-limit buckets are all **per-process, in-memory state** — by design, matching `CLAUDE.md`'s "no database" decision. This means:
  - **The app must run as a single instance/replica**, or if horizontally scaled, requests must be **sticky to the instance that created a given job** (session affinity by client IP or similar). Without this, a file processed on instance A and then downloaded via a request routed to instance B will 404 — the download link, the file, and the rate-limit counters all live only in instance A's memory.
  - Restarting the container (a deploy, a crash, a platform-initiated restart) loses all in-flight job state — any file not yet downloaded is gone, and any pending rate-limit counters reset. This is an accepted, intentional trade-off for a stateless free tool (per `CLAUDE.md`), not a bug — but it means **zero-downtime rolling deploys with multiple replicas are not safe with the app in its current form**, and this should be a conscious platform-configuration choice (single instance, or scale-to-one), not something discovered after users start reporting broken downloads.

---

## 8. Domain configuration requirements

- `NEXT_PUBLIC_SITE_URL` is the only code-level domain configuration point (drives canonical URLs, Open Graph/Twitter metadata, `sitemap.xml`, `robots.txt`'s sitemap reference). **Must be set to the real production domain** before launch — left unset, every one of those surfaces will reference the `https://goatpdf.app` placeholder regardless of where the app actually lives.
- `src/app/contact/page.tsx` hardcodes `support@goatpdf.app` as the contact email — **update this to a real, monitored inbox** on the actual domain before launch (flagged previously in the Phase 10 report; still unresolved).
- **HTTPS/TLS:** the app itself doesn't terminate TLS (`next start` serves plain HTTP) — this is expected for a containerized deployment behind a PaaS's own edge/load balancer, which is what actually terminates HTTPS. Confirm the chosen platform does this automatically (Render, Railway, and Fly.io all do by default for their generated/custom domains) before relying on the `Strict-Transport-Security` header, which only has any effect once real HTTPS is in place.
- **Reverse-proxy trust:** `clientIpFromRequest()` (used by both rate limiting and analytics IP-forwarding) trusts the *first* entry of the `X-Forwarded-For` header as the real client IP. This is only safe when the app is **never reachable directly**, only through a proxy that itself sets/overwrites this header (true of standard PaaS setups) — if the app were ever exposed directly to the public internet without going through the platform's edge, a client could forge this header and both rate limiting and IP-based analytics counting would become trivially spoofable. Worth an explicit platform-configuration check, not just an assumption.
- DNS: no code-level requirement beyond pointing the chosen domain at whatever the platform's deployment target expects (a CNAME to the platform, typically). Nothing in the app assumes a specific DNS provider.
- Consider setting `NEXT_TELEMETRY_DISABLED=1` in the Docker build — Next.js sends anonymous build telemetry to Vercel by default; disabling it is a one-line, zero-risk choice that's consistent with this project's otherwise deliberately minimal data-collection stance (Phases 10 and 12).

---

## 9. Production deployment checklist

Grouped in the order they'd actually need doing. Nothing here has been done automatically — this is the list to work through before a real deploy.

### Must do before any deployment
- [ ] **Write the `Dockerfile`** (Node + LibreOffice + native deps for sharp/@napi-rs/canvas) — does not exist yet. Use a Debian-based Node image (Section 5), not Alpine.
- [ ] **Write `.dockerignore`** alongside it (exclude `node_modules`, `.next`, `.git`, `tests/`, `test-results/`, `playwright-report/`, `coverage/`).
- [ ] Decide on `output: "standalone"` vs. full `node_modules` in the image, and if choosing `standalone`, explicitly handle the pdfjs-dist `standard_fonts`/`cmaps` asset-copy gap (Section 5) — then **actually convert a real PDF with non-embedded fonts through the built image** to confirm rendering isn't silently broken, not just that the container starts.
- [ ] Use `npm ci` (not `npm install`) in the Docker build, so the committed `package-lock.json` is honored exactly.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real production domain in the platform's environment configuration.
- [ ] Replace the placeholder `support@goatpdf.app` contact email in `src/app/contact/page.tsx` with a real, monitored address on the real domain.
- [ ] Confirm `GOATPDF_DISABLE_RATE_LIMIT` is **not** present anywhere in the production environment.
- [ ] Choose and pin a Node LTS version for the base image (20 or 22 recommended, matching `@types/node`'s `^20` range at minimum).

### Platform configuration
- [ ] Confirm the target platform terminates HTTPS automatically for the chosen domain (custom domain + managed TLS cert).
- [ ] Configure the platform to run **exactly one instance/replica** of this app, or confirm session affinity (sticky sessions by client) is enabled if it ever scales beyond one — required by the in-memory job/rate-limit state (Section 7).
- [ ] Confirm the platform's edge sets `X-Forwarded-For` correctly and the app is never reachable bypassing that edge (Section 8).
- [ ] Confirm the platform passes a `PORT` environment variable (or configure one) and that the app is reachable on it — quick smoke test, not an assumption.
- [ ] Size the container's disk/writable layer with a few GB of headroom for concurrent job temp files (Section 6) — no persistent volume should be attached.
- [ ] If the platform requires a health-check path, either point it at `/` (works today) or add a dedicated lightweight endpoint.

### Before every deploy (should be a CI gate, not manual)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (198 unit tests as of this review)
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes (144 e2e tests + 2 expected cross-project skips as of this review)
- [ ] `npm audit` — 0 known vulnerabilities (0 as of this review)

### Nice-to-have, not blocking
- [ ] Add a `.env.example` documenting the variables in Section 1 (explicitly *not* including `GOATPDF_DISABLE_RATE_LIMIT`).
- [ ] Add a dedicated `/api/health` (or similar) endpoint if the platform's default health check isn't sufficient.
- [ ] Set `NEXT_TELEMETRY_DISABLED=1` in the Docker build.
- [ ] After the first real deploy, do one production smoke test per tool (all 8) against the live URL, not just against `localhost`.

---

## What this document does *not* do

- It does not create the `Dockerfile` or `.dockerignore`.
- It does not set any environment variable on any platform.
- It does not register or configure a domain.
- It does not deploy the application anywhere.

All of the above remain explicit, separate actions for whenever deployment is actually authorized.

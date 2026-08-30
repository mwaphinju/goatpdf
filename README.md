# GOAT PDF

**Free PDF tools that just work.**

A free, fast, mobile-friendly PDF utility website. No accounts, no payments, no subscriptions — just upload a file, run a tool, download the result.

## Tools (MVP)

1. **Compress PDF — live**
2. **Merge PDF — live**
3. **Split PDF — live**
4. **Rotate PDF — live**
5. **Delete PDF Pages — live** (`/tools/delete-pdf-pages`)
6. **JPG to PDF — live**
7. **PDF to JPG — live**
8. **PDF to Word — live**

## Status

🎉 **All 8 MVP tools are fully working.** Compress: pick Recommended / High Quality / Maximum Compression and see the actual original size, compressed size, space saved, and percentage reduction — never a claimed fixed percentage, and never a file larger than what you uploaded. Merge: upload, add/remove/reorder files, merge, download, start over. Split: see the page count, split into individual pages (as a ZIP) or extract specific page ranges (e.g. `1-3, 5, 7-9`). Rotate: 90°/180°/270°, every page or a chosen subset. Delete Pages: pick pages from a grid and remove them (you can't delete every page). JPG to PDF: upload JPG or PNG images, reorder them, choose page size/orientation/margins. PDF to JPG: choose image quality and convert every page or a selection, downloading a single JPEG or a ZIP. PDF to Word: converts via a real local LibreOffice install, with an explicit disclaimer that formatting isn't guaranteed to be preserved perfectly. All eight are backed by real processing, secure file validation, random-UUID temp storage with automatic cleanup, and single-use download links.

Every tool page now follows the same shape (title, description, upload, options, processing/success/error states, download, start over, related tools), with shared components for the repeated pieces and a pass for keyboard focus states, touch targets, and reduced-motion support. The app has also been through a security and privacy hardening pass: per-IP rate limiting on every processing and download endpoint, a full set of security headers (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and more — see [next.config.ts](./next.config.ts)), and real `/privacy`, `/terms`, `/about`, and `/contact` pages linked from the footer, with the Privacy Policy describing exactly what the implementation actually does (and doesn't) with your files.

The site is also SEO-ready: every page has a unique title, meta description, canonical URL, and full Open Graph/Twitter Card metadata (including a real generated social-preview image); every tool page carries `SoftwareApplication`/`BreadcrumbList`/`FAQPage` structured data and real, tool-specific "How it works" + FAQ content (not a bare upload widget); `/sitemap.xml` and `/robots.txt` are live, and `/api/*` (processing endpoints, single-use download links) is excluded from both crawling and indexing.

Optional, privacy-conscious analytics is available too (off by default) — see [Analytics](#analytics) below. What's left before launch is infrastructure, not content or tool functionality: a Lighthouse/performance pass, a dependency audit, and a Dockerfile (with LibreOffice installed) for real deployment. See the "Development phases" section of [CLAUDE.md](./CLAUDE.md) for the current plan and status.

**Before deploying**, set the `NEXT_PUBLIC_SITE_URL` environment variable to the real production domain — it defaults to a placeholder (`https://goatpdf.app`) used for canonical URLs, Open Graph tags, and the sitemap during development.

## How it works

Files are uploaded, processed on the server, and made available for download through a private, random-ID link. Uploaded and generated files are **automatically deleted** shortly after processing — nothing is stored long-term, and nothing is ever exposed publicly.

## Analytics

GOAT PDF can optionally record a small, fixed set of usage events — page views, tool views, file uploads, processing started/completed/failed, and downloads completed, each with the relevant tool name (see [privacy](./src/app/privacy/page.tsx) for the exact list). It's **off by default** and controlled entirely through server-side environment variables — no third-party script is ever loaded in the browser, and nothing is tracked unless you explicitly turn it on:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANALYTICS_ENABLED` | No (default off) | Set to exactly `true` to turn analytics on at all. Any other value (or unset) means fully off — no events are recorded, logged, or sent anywhere. |
| `ANALYTICS_ENDPOINT_URL` | No | A URL to forward each event to as a JSON POST. Works with any collector that accepts simple event POSTs — e.g. a self-hosted Plausible/Umami instance, or your own collector. If unset while analytics is enabled, events are just logged to the server's own console/logs instead. |
| `ANALYTICS_SITE_ID` | No | An identifier some collectors expect (e.g. a Plausible domain or Umami website ID), included in the forwarded event payload. |

What's tracked is deliberately narrow: an event is only ever `{ name, tool?, path? }` — never a filename, never file contents, never anything read from inside an uploaded file. There's no cookie and no persistent per-visitor identifier; events aren't linked to each other as coming from "the same person." Client-side events (page views, tool views, file uploads) are always sent to GOAT PDF's own `/api/analytics` route first and validated there — the browser never talks to a third-party analytics service directly. See [lib/analytics/](./src/lib/analytics/) for the implementation and [the Privacy Policy](./src/app/privacy/page.tsx) for the full, plain-language explanation.

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **PDF processing:** `pdf-lib`, `pdfjs-dist` + `@napi-rs/canvas` (rasterization), `sharp`, `jszip`, LibreOffice (headless, for PDF → Word)
- **Testing:** Vitest (unit) + Playwright (end-to-end)
- **Deployment:** Docker, deployed to a Docker-capable PaaS

No database. No user accounts. See [CLAUDE.md](./CLAUDE.md) for the full architecture, security requirements, and the list of things this project deliberately does **not** build.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

PDF to Word needs a local **LibreOffice** install (`soffice` on `PATH`, or at the default Windows install location, or point `SOFFICE_PATH` at the binary). Every other tool works with just `npm install`. Without LibreOffice, PDF to Word will fail with a clear "couldn't convert" error rather than crashing anything else.

## Testing

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test          # unit tests (Vitest)
npm run test:e2e      # end-to-end tests (Playwright — builds and serves the app itself)
npm run build          # production build
```

The first time you run `npm run test:e2e`, install the Playwright browser binary once with `npx playwright install chromium`.

## Contributing / project rules

If you're working on this codebase (human or AI), read [CLAUDE.md](./CLAUDE.md) first. It defines the architecture, coding standards, security requirements, testing requirements, and the phase-by-phase development process this project follows.

## License

TBD.

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
8. PDF to Word — *coming soon*

## Status

🚧 **7 of 8 tools are fully working** — only PDF to Word remains a placeholder. Compress: pick Recommended / High Quality / Maximum Compression and see the actual original size, compressed size, space saved, and percentage reduction — never a claimed fixed percentage, and never a file larger than what you uploaded. Merge: upload, add/remove/reorder files, merge, download, start over. Split: see the page count, split into individual pages (as a ZIP) or extract specific page ranges (e.g. `1-3, 5, 7-9`). Rotate: 90°/180°/270°, every page or a chosen subset. Delete Pages: pick pages from a grid and remove them (you can't delete every page). JPG to PDF: upload JPG or PNG images, reorder them, choose page size/orientation/margins. PDF to JPG: choose image quality and convert every page or a selection, downloading a single JPEG or a ZIP. All seven are backed by real processing, secure file validation, random-UUID temp storage with automatic cleanup, and single-use download links. See the "Development phases" section of [CLAUDE.md](./CLAUDE.md) for the current plan and status.

## How it works

Files are uploaded, processed on the server, and made available for download through a private, random-ID link. Uploaded and generated files are **automatically deleted** shortly after processing — nothing is stored long-term, and nothing is ever exposed publicly.

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

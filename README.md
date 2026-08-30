# GOAT PDF

**Free PDF tools that just work.**

A free, fast, mobile-friendly PDF utility website. No accounts, no payments, no subscriptions — just upload a file, run a tool, download the result.

## Tools (MVP)

1. Compress PDF — *coming soon*
2. **Merge PDF — live**
3. Split PDF — *coming soon*
4. Rotate PDF — *coming soon*
5. Delete PDF Pages — *coming soon*
6. JPG to PDF — *coming soon*
7. PDF to JPG — *coming soon*
8. PDF to Word — *coming soon*

## Status

🚧 **Merge PDF is fully working** — upload, add/remove/reorder files, merge, download, start over — backed by a real pdf-lib implementation, secure file validation, random-UUID temp storage with automatic cleanup, and a single-use download link. The other 7 tools are still placeholder pages with a working upload zone but a "coming soon" notice instead of real processing. See the "Development phases" section of [CLAUDE.md](./CLAUDE.md) for the current plan and status.

## How it works

Files are uploaded, processed on the server, and made available for download through a private, random-ID link. Uploaded and generated files are **automatically deleted** shortly after processing — nothing is stored long-term, and nothing is ever exposed publicly.

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **PDF processing:** `pdf-lib`, `pdf.js`, `sharp`, LibreOffice (headless, for PDF → Word)
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

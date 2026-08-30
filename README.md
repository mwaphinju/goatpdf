# GOAT PDF

**Free PDF tools that just work.**

A free, fast, mobile-friendly PDF utility website. No accounts, no payments, no subscriptions — just upload a file, run a tool, download the result.

## Tools (MVP)

1. Compress PDF
2. Merge PDF
3. Split PDF
4. Rotate PDF
5. Delete PDF Pages
6. JPG to PDF
7. PDF to JPG
8. PDF to Word

## Status

🚧 Application shell built (Phase 0 + Phase 1 UI). The site has a working homepage, responsive navigation, and a placeholder page for each of the 8 tools with a real (client-side validated) upload zone — but no PDF processing yet; each tool's action button shows a "coming soon" notice. The server-side upload/processing pipeline is the next phase. See the "Development phases" section of [CLAUDE.md](./CLAUDE.md) for the current plan and status.

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

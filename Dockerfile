# syntax=docker/dockerfile:1

########################################################################
# 1. Build stage — full `npm ci` (including devDependencies: TypeScript,
#    Tailwind's PostCSS plugin, eslint-config-next) needed to run
#    `next build`. Produces .next/.
########################################################################
FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

########################################################################
# 2. Runtime stage — LibreOffice + a production-only node_modules tree.
#
# Deliberately NOT using Next's `output: "standalone"`: pdfRenderer.ts
# resolves pdfjs-dist's standard_fonts/cmaps assets via a runtime-built
# path (`path.join(process.cwd(), "node_modules", "pdfjs-dist", ...)`),
# not an import/require, so standalone's file tracer can't see them and
# would silently omit them — PDF to JPG would build and start fine, then
# mis-render any page needing standard-font substitution. A full
# `npm ci --omit=dev` here installs the real node_modules tree (correct
# native binaries for sharp/@napi-rs/canvas, pdfjs-dist's asset files
# intact) instead of a traced subset. See DEPLOYMENT.md Section 5.
#
# Debian (not Alpine): LibreOffice's Linux packaging is far more reliable
# on Debian/Ubuntu, and sharp/@napi-rs/canvas both have prebuilt glibc
# binaries — Alpine (musl) risks slow from-source native builds on top of
# a much harder LibreOffice install.
########################################################################
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# LibreOffice (PDF to Word — see CLAUDE.md's "PDF to Word design notes":
# the --infilter=writer_pdf_import flag in pdfToWord.ts only works at all
# if LibreOffice itself is present) + metric-compatible fonts so
# converted/rendered documents render sensibly instead of falling back to
# a generic substitute.
#
# Acquire::Retries: LibreOffice's dependency tree is large (~150 packages)
# and slow to fetch; a mid-download DNS/network blip on a long apt-get run
# is a real, observed failure mode here, not hypothetical — apt retrying
# a handful of times is cheap insurance against it.
RUN apt-get update && apt-get install -y --no-install-recommends -o Acquire::Retries=5 \
    libreoffice \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user — standard container hardening, consistent with
# this app's overall security posture (see next.config.ts's headers()).
RUN groupadd --system goatpdf && useradd --system --gid goatpdf --create-home goatpdf

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

RUN chown -R goatpdf:goatpdf /app
USER goatpdf

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "run", "start"]

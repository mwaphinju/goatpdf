import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { germanToolContent } from "@/i18n/toolContent/de";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS } from "@/i18n/toolContent";

const LAUNCHED_TOOLS = LAUNCHED_GERMAN_TOOL_SLUGS.map((slug) => ({
  slug,
  name: germanToolContent[slug].name,
  href: GERMAN_TOOL_ROUTES[slug],
}));

// These stay in English on purpose: the pages they link to (/about,
// /contact, /privacy, /terms) are English-only content (see
// GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md, "Legal disclosure").
// Translating just the link label while the destination page stays
// English would misrepresent what a visitor actually gets.
const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

/**
 * German equivalent of Footer.tsx. Kept separate rather than making
 * Footer locale-aware: it only lists the 4 launched German tools (not
 * the full registry), and deliberately has no "Guides" column, since the
 * 4 English blog guides aren't translated yet and linking English-only
 * content from a German footer under German section labels would be
 * exactly the kind of unintended English leak this launch avoids
 * elsewhere.
 */
export function GermanFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Link href="/de" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <LogoMark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg tracking-tight">GOAT PDF</span>
          </Link>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Kostenlose PDF-Tools, die einfach funktionieren. Keine Konten, keine Wasserzeichen. Hochgeladene
            Dateien werden vertraulich verarbeitet und nach kurzer Zeit automatisch gelöscht.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <ul className="flex flex-col gap-2">
            {LAUNCHED_TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  className="text-sm text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-600 sm:px-6 dark:border-slate-800 dark:text-slate-400">
        <p>© {year} GOAT PDF. Die Verarbeitung erfolgt automatisch. Dateien werden nicht länger als nötig gespeichert.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

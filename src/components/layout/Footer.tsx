import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { tools } from "@/lib/tools";

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const half = Math.ceil(tools.length / 2);
  const columns = [tools.slice(0, half), tools.slice(half)];

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <LogoMark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg tracking-tight">GOAT PDF</span>
          </Link>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Free PDF tools that just work. No accounts, no watermarks. Uploaded files are processed
            privately and deleted automatically after a short time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="flex flex-col gap-2">
              {column.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-sm text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
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
        <p>© {year} GOAT PDF. All processing happens automatically — no files are stored longer than necessary.</p>
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

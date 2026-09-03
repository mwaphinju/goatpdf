"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, LogoMark, MenuIcon, XIcon } from "@/components/icons";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { getToolBySlug } from "@/lib/tools";
import { germanToolContent } from "@/i18n/toolContent/de";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS } from "@/i18n/toolContent";

const LAUNCHED_TOOLS = LAUNCHED_GERMAN_TOOL_SLUGS.map((slug) => ({
  slug,
  name: germanToolContent[slug].name,
  href: GERMAN_TOOL_ROUTES[slug],
  icon: getToolBySlug(slug)!.icon,
}));

/**
 * German equivalent of Header.tsx. Kept separate rather than making
 * Header locale-aware, since it only ever lists the 4 launched German
 * tools (not the full 8-tool registry Header.tsx reads from lib/tools.ts)
 * and every link needs a German path, not the English one Header.tsx
 * hard-codes.
 */
export function GermanHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/de" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <LogoMark className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          <span className="text-lg tracking-tight">GOAT PDF</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden dark:text-slate-300 dark:hover:bg-slate-800">
              Tools
              <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 z-50 mt-2 grid w-72 grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {LAUNCHED_TOOLS.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.href}
                  className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </details>
          <Link
            href="/de#tools"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Alle Tools
          </Link>
          <LanguageSelector currentLocale="de" />
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" className="border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {LAUNCHED_TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <LanguageSelector currentLocale="de" />
          </div>
        </nav>
      )}
    </header>
  );
}

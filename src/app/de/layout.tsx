import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { JsonLd } from "@/components/JsonLd";
import { GermanHeader } from "@/components/layout/GermanHeader";
import { GermanFooter } from "@/components/layout/GermanFooter";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "../(en)/globals.css";

// This is a second, independent root layout (Next.js's "multiple root
// layouts" pattern via a plain top-level segment with no shared
// app/layout.tsx above it: see (en)/layout.tsx for the English one). It
// exists so this segment can render <html lang="de"> while every English
// page keeps <html lang="en">, without dynamic-rendering the whole site
// (the alternative, reading the current locale from headers() in a
// single shared layout, would force every route in the app out of
// static generation). See GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md's
// "Existing Architecture Review" section for the full reasoning.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "PDF-Dateien online komprimieren, zusammenfügen, teilen und in Word umwandeln, schnell und einfach. Kostenlos, privat, ohne Konto.";

export const metadata: Metadata = {
  // Homepage-specific fields (title/description/OG/canonical/hreflang) are
  // set by de/page.tsx itself via buildPageMetadata, the same convention
  // (en)/layout.tsx uses for the English homepage. This layout only
  // supplies metadataBase and the title template every German tool page
  // needs to get its own "%s | GOAT PDF" suffix automatically.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GOAT PDF: Kostenlose PDF-Tools, die einfach funktionieren",
    template: "%s | GOAT PDF",
  },
  description: DESCRIPTION,
};

const websiteStructuredDataDe = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: `${SITE_URL}/de`,
  description: "Kostenlose, schnelle, mobilfreundliche PDF-Tools: komprimieren, zusammenfügen, teilen und konvertieren. Ohne Konto.",
  inLanguage: "de",
};

export default function GermanRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
        <JsonLd data={websiteStructuredDataDe} />
        <AnalyticsPageView />
        <GermanHeader />
        <main className="flex-1">{children}</main>
        <GermanFooter />
      </body>
    </html>
  );
}

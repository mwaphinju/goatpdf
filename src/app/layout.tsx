import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { JsonLd } from "@/components/JsonLd";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/ga";
import { buildPageMetadata, SITE_URL } from "@/lib/seo";
import { websiteStructuredData } from "@/lib/structuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Compress, merge, split and convert PDF files online — quickly and easily. Free, private, no account required.";

export const metadata: Metadata = {
  // buildPageMetadata appends " — GOAT PDF" to whatever title it's given
  // (for openGraph/twitter's title, e.g. "Merge PDF — GOAT PDF"), so the
  // homepage passes just the tagline here and overrides the real <title>
  // separately below to the full "GOAT PDF — ..." form every other page's
  // "%s — GOAT PDF" template also produces.
  ...buildPageMetadata({ path: "/", title: "Free PDF Tools That Just Work", description: DESCRIPTION }),
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GOAT PDF — Free PDF Tools That Just Work",
    template: "%s — GOAT PDF",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <JsonLd data={websiteStructuredData()} />
        <AnalyticsPageView />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      {/* Only mounted when a Measurement ID is configured — see lib/analytics/ga.ts.
          GA4's own Enhanced Measurement tracks page views and client-side route
          changes automatically (confirmed via Next.js's own docs — see ANALYTICS.md),
          so no manual page_view call is made here to avoid double-counting. */}
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}

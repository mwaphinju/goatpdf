"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackToolView } from "@/lib/analytics/ga";
import { trackClientEvent } from "@/lib/analytics/trackClientEvent";
import { getToolBySlug } from "@/lib/tools";
import { GERMAN_TOOL_ROUTES, LAUNCHED_GERMAN_TOOL_SLUGS } from "@/i18n/toolContent";

// Matches both an English tool page (/tools/<slug>) and a launched German
// one (/de/tools/<slug>); the German slug is a different string per tool
// (e.g. "pdf-komprimieren", not "compress-pdf"), so it's resolved back to
// the same real tool identifier the English side uses via
// GERMAN_SLUG_TO_TOOL_SLUG below, rather than inventing a second,
// locale-specific tool identifier that lib/tools.ts's registry (and
// parseClientAnalyticsEvent's validation against it) doesn't know about.
const TOOL_PATH_PATTERN = /^(\/de)?\/tools\/([a-z0-9-]+)\/?$/;

const GERMAN_SLUG_TO_TOOL_SLUG: Record<string, string> = Object.fromEntries(
  LAUNCHED_GERMAN_TOOL_SLUGS.map((slug) => [GERMAN_TOOL_ROUTES[slug].replace(/^\/de\/tools\//, ""), slug]),
);

/**
 * Renders nothing — reports a page_view (and, on a tool page, an additional
 * tool_view) whenever the route changes, to this app's own internal
 * analytics. Mounted once in each root layout (English and German).
 *
 * GA4's page_view is deliberately NOT sent from here — it's tracked
 * automatically by GA4's own Enhanced Measurement (browser history events),
 * enabled by mounting <GoogleAnalytics> in layout.tsx; sending it manually
 * too would double-count every page view. tool_view has no GA4 equivalent
 * (it's this app's own concept), so it is sent explicitly.
 *
 * A German tool view is distinguished from the equivalent English one by
 * `path` (already the real, distinct German URL, e.g.
 * "/de/tools/pdf-komprimieren"), while `tool` stays the same real tool
 * identifier both locales share, so tool-level aggregation (e.g. "how many
 * compress-pdf views total") keeps working without a schema change; slicing
 * by locale is a `path` prefix check on the receiving end. Exactly one
 * tool_view fires per route change, from the single match below, whichever
 * locale it belongs to.
 */
export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent("page_view", { path: pathname });

    const match = pathname.match(TOOL_PATH_PATTERN);
    if (match) {
      const [, germanPrefix, slug] = match;
      const toolSlug = germanPrefix ? GERMAN_SLUG_TO_TOOL_SLUG[slug] : getToolBySlug(slug) ? slug : undefined;

      if (toolSlug) {
        trackClientEvent("tool_view", { tool: toolSlug, path: pathname });
        trackToolView(toolSlug);
      }
    }
  }, [pathname]);

  return null;
}

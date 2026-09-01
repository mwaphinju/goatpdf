"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackToolView } from "@/lib/analytics/ga";
import { trackClientEvent } from "@/lib/analytics/trackClientEvent";
import { getToolBySlug } from "@/lib/tools";

const TOOL_PATH_PATTERN = /^\/tools\/([a-z0-9-]+)\/?$/;

/**
 * Renders nothing — reports a page_view (and, on a tool page, an additional
 * tool_view) whenever the route changes, to this app's own internal
 * analytics. Mounted once in the root layout.
 *
 * GA4's page_view is deliberately NOT sent from here — it's tracked
 * automatically by GA4's own Enhanced Measurement (browser history events),
 * enabled by mounting <GoogleAnalytics> in layout.tsx; sending it manually
 * too would double-count every page view. tool_view has no GA4 equivalent
 * (it's this app's own concept), so it is sent explicitly.
 */
export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent("page_view", { path: pathname });

    const toolSlug = pathname.match(TOOL_PATH_PATTERN)?.[1];
    if (toolSlug && getToolBySlug(toolSlug)) {
      trackClientEvent("tool_view", { tool: toolSlug, path: pathname });
      trackToolView(toolSlug);
    }
  }, [pathname]);

  return null;
}

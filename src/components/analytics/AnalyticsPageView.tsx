"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClientEvent";
import { getToolBySlug } from "@/lib/tools";

const TOOL_PATH_PATTERN = /^\/tools\/([a-z0-9-]+)\/?$/;

/** Renders nothing — reports a page_view (and, on a tool page, an additional tool_view) whenever the route changes. Mounted once in the root layout. */
export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent("page_view", { path: pathname });

    const toolSlug = pathname.match(TOOL_PATH_PATTERN)?.[1];
    if (toolSlug && getToolBySlug(toolSlug)) {
      trackClientEvent("tool_view", { tool: toolSlug, path: pathname });
    }
  }, [pathname]);

  return null;
}

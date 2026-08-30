"use client";

import type { ClientAnalyticsEventName } from "@/lib/analytics/events";

/**
 * Reports a client-side event (page view, tool view, file upload) to this
 * app's own /api/analytics route — never directly to a third party, so no
 * external script or CSP allowance is needed. Uses sendBeacon where
 * available so the request survives a page navigation. Best-effort: if
 * analytics is disabled or unreachable, this silently does nothing and
 * never affects the actual UI.
 */
export function trackClientEvent(name: ClientAnalyticsEventName, params: { tool?: string; path?: string } = {}) {
  try {
    const body = JSON.stringify({ name, ...params });

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics interfere with the actual user flow.
  }
}

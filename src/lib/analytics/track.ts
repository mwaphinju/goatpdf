import type { AnalyticsEvent } from "@/lib/analytics/events";

/**
 * Privacy-conscious, provider-agnostic analytics. Off by default — nothing
 * is tracked, logged, or sent anywhere unless ANALYTICS_ENABLED=true is set.
 * When enabled:
 *   - every event is logged locally (matches processing/logger.ts's
 *     logJobEvent pattern) so a self-hosted deployment gets visibility for
 *     free from its own server logs, with no external service required;
 *   - if ANALYTICS_ENDPOINT_URL is also set, the same event is additionally
 *     forwarded there as a simple JSON POST. This works with any collector
 *     that accepts plain event POSTs (a self-hosted Plausible/Umami instance,
 *     a custom collector) without this app depending on a specific vendor's
 *     SDK or loading a third-party script in the browser (which would also
 *     need a CSP script-src allowance — see next.config.ts).
 *
 * All of this only ever runs server-side. Client-originated events (page
 * views, tool views, file uploads) are proxied through this app's own
 * /api/analytics route first, validated there, and sent from here — the
 * browser never talks to a third party directly.
 */

const FORWARD_TIMEOUT_MS = 3000;

export function isAnalyticsEnabled(): boolean {
  return process.env.ANALYTICS_ENABLED === "true";
}

function getEndpointUrl(): string | undefined {
  return process.env.ANALYTICS_ENDPOINT_URL || undefined;
}

function getSiteId(): string | undefined {
  return process.env.ANALYTICS_SITE_ID || undefined;
}

export interface TrackEventOptions {
  /**
   * The real visitor's IP, when this event originated from an HTTP request
   * (page view, file upload) — forwarded to the configured collector via
   * X-Forwarded-For so its own (non-cookie) unique-visitor counting still
   * works, exactly as it would if the collector's script ran in the
   * visitor's own browser. Never stored by this app, and only ever leaves
   * the server if ANALYTICS_ENDPOINT_URL is configured.
   */
  visitorIp?: string | null;
}

/**
 * Records one analytics event. Never throws — a misconfigured or unreachable
 * analytics endpoint must never affect the actual user-facing request that
 * triggered the event. Callers should not await this on the hot path; it's
 * safe to fire-and-forget since every failure mode is swallowed internally.
 */
export async function trackEvent(event: AnalyticsEvent, options: TrackEventOptions = {}): Promise<void> {
  if (!isAnalyticsEnabled()) return;

  console.log("[analytics]", JSON.stringify(event));

  const endpoint = getEndpointUrl();
  if (!endpoint) return;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.visitorIp) headers["X-Forwarded-For"] = options.visitorIp;

    await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...event, siteId: getSiteId(), timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
  } catch {
    // Network error, timeout, non-2xx — none of it should ever surface to the user.
  }
}

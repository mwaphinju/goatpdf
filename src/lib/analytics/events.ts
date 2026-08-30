import { getToolBySlug } from "@/lib/tools";

/**
 * The complete analytics event taxonomy. Structurally narrow by design (like
 * processing/logger.ts's JobLogEvent) — an AnalyticsEvent can only ever carry
 * a known event name, a real tool slug, and a page path. There is no field
 * for a filename, file content, or any other free-form data, so it is not
 * possible for a call site to accidentally leak either into analytics.
 */
export const ANALYTICS_EVENTS = [
  "page_view",
  "tool_view",
  "file_upload",
  "processing_started",
  "processing_completed",
  "processing_failed",
  "download_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** The subset of events a page can legitimately report about itself through the public /api/analytics endpoint — never the server-lifecycle events, which only the processing/download routes themselves are trusted to report. */
export const CLIENT_ANALYTICS_EVENTS = ["page_view", "tool_view", "file_upload"] as const;
export type ClientAnalyticsEventName = (typeof CLIENT_ANALYTICS_EVENTS)[number];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  /** The tool this event relates to, when applicable — omitted for events with no tool context (e.g. a page_view on /privacy). */
  tool?: string;
  /** The page path, for page_view/tool_view events. */
  path?: string;
}

const MAX_PATH_LENGTH = 200;

/** True only for a same-origin-looking, bounded-length path — a defensive check on what the public endpoint will forward to the configured analytics collector. */
function isPlausiblePath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_PATH_LENGTH && value.startsWith("/");
}

/**
 * Validates an untrusted JSON body from the client into a real AnalyticsEvent,
 * or returns null. Rejects anything outside CLIENT_ANALYTICS_EVENTS (so a
 * script in the browser console can't forge a processing_completed/
 * download_completed event), any tool slug that isn't one of the 8 real
 * tools, and any path that isn't a plausible site-relative path.
 */
export function parseClientAnalyticsEvent(body: unknown): AnalyticsEvent | null {
  if (typeof body !== "object" || body === null) return null;

  const { name, tool, path } = body as { name?: unknown; tool?: unknown; path?: unknown };

  if (typeof name !== "string" || !CLIENT_ANALYTICS_EVENTS.includes(name as ClientAnalyticsEventName)) {
    return null;
  }

  const event: AnalyticsEvent = { name: name as ClientAnalyticsEventName };

  if (tool !== undefined) {
    if (typeof tool !== "string" || !getToolBySlug(tool)) return null;
    event.tool = tool;
  }

  if (path !== undefined) {
    if (!isPlausiblePath(path)) return null;
    event.path = path;
  }

  return event;
}

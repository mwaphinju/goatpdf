import { parseClientAnalyticsEvent } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { rateLimitResponse } from "@/lib/processing/apiHelpers";

export const runtime = "nodejs";

// Generous relative to the processing endpoints — a single page visit can
// reasonably fire a page_view, a tool_view, and a file_upload in quick
// succession, and normal browsing across several tool pages adds up fast.
const ANALYTICS_RATE_LIMIT_PER_WINDOW = 120;

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "analytics", ANALYTICS_RATE_LIMIT_PER_WINDOW);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const event = parseClientAnalyticsEvent(body);
  if (!event) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Fire-and-forget — trackEvent never throws, and the client doesn't need
  // to wait for (or know about) whatever an external collector does with it.
  void trackEvent(event, { visitorIp: clientIpFromRequest(request) });

  return Response.json({ ok: true });
}

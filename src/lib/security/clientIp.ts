/**
 * Extracts the best-effort real client IP from a request, trusting only the
 * first hop of x-forwarded-for (the entry a reverse proxy appends closest to
 * the client) — shared by rate limiting (as a bucket key) and analytics (to
 * forward to a configured collector so its own privacy-conscious unique-visitor
 * counting still works through a server-side proxy). Returns null rather than
 * a placeholder when no proxy header is present, so callers decide their own
 * fallback behavior instead of silently sharing an "unknown" bucket/identity.
 */
export function clientIpFromRequest(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

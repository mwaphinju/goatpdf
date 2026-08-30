export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Basic in-memory, per-process, per-IP rate limiter — deliberately simple,
 * matching CLAUDE.md's architecture (no database, no auth layer, a single
 * deployable process). It stops casual scripted overuse of the processing
 * endpoints; it is not a substitute for a real edge/WAF rate limiter under
 * sustained, distributed abuse, and resets if the process restarts.
 */
const buckets = new Map<string, Bucket>();

export const DEFAULT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function clientKeyFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // No proxy header present (e.g. direct connection) — every such client
  // shares one bucket, which is intentionally conservative behind a PaaS
  // deployment where x-forwarded-for is expected to always be set.
  return "unknown";
}

/** Checks and records one request against a named scope's per-IP limit (e.g. "process" for the 8 upload endpoints, "download" for the download route). */
export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  // Escape hatch for the Playwright suite: every e2e request comes from the
  // same loopback connection with no x-forwarded-for header, so without this
  // the whole test run would collapse into a single IP bucket and start
  // failing itself with 429s partway through. Never set in real deployment.
  if (process.env.GOATPDF_DISABLE_RATE_LIMIT === "1") {
    return { ok: true, retryAfterSeconds: 0 };
  }

  const key = `${scope}:${clientKeyFromRequest(request)}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Removes expired buckets so memory doesn't grow unbounded under high IP cardinality. Backstop, mirrors the temp-file cleanup sweep. */
export function sweepExpiredRateLimitBuckets(now: number = Date.now()): number {
  let removed = 0;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
      removed++;
    }
  }
  return removed;
}

let sweepIntervalHandle: ReturnType<typeof setInterval> | null = null;

/** Starts the periodic bucket sweep. Idempotent — safe to call more than once (e.g. across dev-server hot reloads). */
export function startRateLimitCleanupScheduler(intervalMs: number = DEFAULT_WINDOW_MS): void {
  if (sweepIntervalHandle) return;

  sweepIntervalHandle = setInterval(() => {
    sweepExpiredRateLimitBuckets();
  }, intervalMs);

  sweepIntervalHandle.unref?.();
}

export function stopRateLimitCleanupScheduler(): void {
  if (sweepIntervalHandle) {
    clearInterval(sweepIntervalHandle);
    sweepIntervalHandle = null;
  }
}

/** Test-only: clears all bucket state so tests don't leak between each other. */
export function _resetRateLimitStateForTests(): void {
  buckets.clear();
}

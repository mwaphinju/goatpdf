import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetRateLimitStateForTests,
  checkRateLimit,
  sweepExpiredRateLimitBuckets,
} from "@/lib/security/rateLimit";

function requestFromIp(ip: string): Request {
  return new Request("http://localhost/api/merge-pdf", {
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  _resetRateLimitStateForTests();
});

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const request = requestFromIp("203.0.113.1");

    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(request, "process", 3).ok).toBe(true);
    }

    const blocked = checkRateLimit(request, "process", 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate buckets per IP", () => {
    const first = requestFromIp("203.0.113.10");
    const second = requestFromIp("203.0.113.20");

    expect(checkRateLimit(first, "process", 1).ok).toBe(true);
    expect(checkRateLimit(first, "process", 1).ok).toBe(false);
    // A different IP has its own, unaffected bucket.
    expect(checkRateLimit(second, "process", 1).ok).toBe(true);
  });

  it("tracks separate buckets per scope, for the same IP", () => {
    const request = requestFromIp("203.0.113.30");

    expect(checkRateLimit(request, "process", 1).ok).toBe(true);
    expect(checkRateLimit(request, "process", 1).ok).toBe(false);
    // The download scope has its own limit, unaffected by the process scope.
    expect(checkRateLimit(request, "download", 1).ok).toBe(true);
  });

  it("resets once the window has elapsed", () => {
    vi.useFakeTimers();
    try {
      const request = requestFromIp("203.0.113.40");
      expect(checkRateLimit(request, "process", 1, 1000).ok).toBe(true);
      expect(checkRateLimit(request, "process", 1, 1000).ok).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(checkRateLimit(request, "process", 1, 1000).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("only trusts the first hop of x-forwarded-for", () => {
    const spoofed = new Request("http://localhost/api/merge-pdf", {
      headers: { "x-forwarded-for": "203.0.113.50, 10.0.0.1, 10.0.0.2" },
    });
    const same = requestFromIp("203.0.113.50");

    expect(checkRateLimit(spoofed, "process", 1).ok).toBe(true);
    // Same real client IP (first hop) — shares the bucket already opened above.
    expect(checkRateLimit(same, "process", 1).ok).toBe(false);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("http://localhost/api/merge-pdf", {
      headers: { "x-real-ip": "203.0.113.60" },
    });

    expect(checkRateLimit(request, "process", 1).ok).toBe(true);
    expect(checkRateLimit(request, "process", 1).ok).toBe(false);
  });

  it("bypasses limiting entirely when GOATPDF_DISABLE_RATE_LIMIT is set", () => {
    const request = requestFromIp("203.0.113.70");
    process.env.GOATPDF_DISABLE_RATE_LIMIT = "1";
    try {
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit(request, "process", 1).ok).toBe(true);
      }
    } finally {
      delete process.env.GOATPDF_DISABLE_RATE_LIMIT;
    }
  });
});

describe("sweepExpiredRateLimitBuckets", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes only buckets whose window has expired", () => {
    vi.useFakeTimers();
    const expiring = requestFromIp("203.0.113.80");
    const fresh = requestFromIp("203.0.113.90");

    checkRateLimit(expiring, "process", 5, 1000);
    vi.advanceTimersByTime(1001);
    checkRateLimit(fresh, "process", 5, 1000);

    const removed = sweepExpiredRateLimitBuckets(Date.now());
    expect(removed).toBe(1);

    // The fresh bucket's limit is still enforced — it wasn't swept away.
    for (let i = 0; i < 4; i++) checkRateLimit(fresh, "process", 5, 1000);
    expect(checkRateLimit(fresh, "process", 5, 1000).ok).toBe(false);
  });
});

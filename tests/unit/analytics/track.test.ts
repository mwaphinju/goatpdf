import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAnalyticsEnabled, trackEvent } from "@/lib/analytics/track";

const ENV_KEYS = ["ANALYTICS_ENABLED", "ANALYTICS_ENDPOINT_URL", "ANALYTICS_SITE_ID"] as const;
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  vi.restoreAllMocks();
});

describe("isAnalyticsEnabled", () => {
  it("is false by default (no env var set)", () => {
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("is false for any value other than the literal string 'true'", () => {
    process.env.ANALYTICS_ENABLED = "1";
    expect(isAnalyticsEnabled()).toBe(false);
    process.env.ANALYTICS_ENABLED = "yes";
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("is true when set to 'true'", () => {
    process.env.ANALYTICS_ENABLED = "true";
    expect(isAnalyticsEnabled()).toBe(true);
  });
});

describe("trackEvent — disabled (default)", () => {
  it("does nothing at all: no console log, no network call", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await trackEvent({ name: "page_view", path: "/" });

    expect(logSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("trackEvent — enabled, no endpoint configured", () => {
  it("logs the event locally and makes no network call", async () => {
    process.env.ANALYTICS_ENABLED = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await trackEvent({ name: "tool_view", tool: "merge-pdf", path: "/tools/merge-pdf" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const [, payload] = logSpy.mock.calls[0];
    expect(JSON.parse(payload as string)).toEqual({
      name: "tool_view",
      tool: "merge-pdf",
      path: "/tools/merge-pdf",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("trackEvent — enabled, endpoint configured", () => {
  it("forwards the event as a JSON POST, including the site id when set", async () => {
    process.env.ANALYTICS_ENABLED = "true";
    process.env.ANALYTICS_ENDPOINT_URL = "https://collector.example/events";
    process.env.ANALYTICS_SITE_ID = "goatpdf.app";
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await trackEvent({ name: "processing_completed", tool: "compress-pdf" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://collector.example/events");
    expect(init?.method).toBe("POST");

    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ name: "processing_completed", tool: "compress-pdf", siteId: "goatpdf.app" });
    expect(typeof body.timestamp).toBe("string");
  });

  it("includes X-Forwarded-For when a visitorIp is given, and omits it otherwise", async () => {
    process.env.ANALYTICS_ENABLED = "true";
    process.env.ANALYTICS_ENDPOINT_URL = "https://collector.example/events";
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await trackEvent({ name: "download_completed", tool: "split-pdf" }, { visitorIp: "203.0.113.5" });
    const headersWithIp = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headersWithIp.get("X-Forwarded-For")).toBe("203.0.113.5");

    fetchSpy.mockClear();
    await trackEvent({ name: "download_completed", tool: "split-pdf" });
    const headersWithoutIp = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headersWithoutIp.has("X-Forwarded-For")).toBe(false);
  });

  it("never throws, even when the forward request fails", async () => {
    process.env.ANALYTICS_ENABLED = "true";
    process.env.ANALYTICS_ENDPOINT_URL = "https://collector.example/events";
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(trackEvent({ name: "processing_failed", tool: "pdf-to-word" })).resolves.toBeUndefined();
  });
});

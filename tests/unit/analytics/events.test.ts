import { describe, expect, it } from "vitest";
import { parseClientAnalyticsEvent } from "@/lib/analytics/events";

describe("parseClientAnalyticsEvent", () => {
  it("accepts a bare page_view", () => {
    expect(parseClientAnalyticsEvent({ name: "page_view", path: "/privacy" })).toEqual({
      name: "page_view",
      path: "/privacy",
    });
  });

  it("accepts a tool_view with a real tool slug", () => {
    expect(parseClientAnalyticsEvent({ name: "tool_view", tool: "merge-pdf", path: "/tools/merge-pdf" })).toEqual({
      name: "tool_view",
      tool: "merge-pdf",
      path: "/tools/merge-pdf",
    });
  });

  it("accepts a file_upload with just a tool", () => {
    expect(parseClientAnalyticsEvent({ name: "file_upload", tool: "compress-pdf" })).toEqual({
      name: "file_upload",
      tool: "compress-pdf",
    });
  });

  it("accepts an event with no tool/path at all", () => {
    expect(parseClientAnalyticsEvent({ name: "page_view" })).toEqual({ name: "page_view" });
  });

  it.each(["processing_started", "processing_completed", "processing_failed", "download_completed"])(
    "rejects the server-only event %s from the public endpoint",
    (name) => {
      expect(parseClientAnalyticsEvent({ name })).toBeNull();
    },
  );

  it("rejects an unknown event name", () => {
    expect(parseClientAnalyticsEvent({ name: "totally_made_up" })).toBeNull();
  });

  it("rejects a tool slug that isn't a real tool", () => {
    expect(parseClientAnalyticsEvent({ name: "tool_view", tool: "not-a-real-tool" })).toBeNull();
  });

  it("rejects a path that doesn't start with /", () => {
    expect(parseClientAnalyticsEvent({ name: "page_view", path: "https://evil.example/x" })).toBeNull();
  });

  it("rejects a path that's absurdly long", () => {
    expect(parseClientAnalyticsEvent({ name: "page_view", path: "/" + "a".repeat(500) })).toBeNull();
  });

  it("rejects non-object bodies", () => {
    expect(parseClientAnalyticsEvent(null)).toBeNull();
    expect(parseClientAnalyticsEvent("page_view")).toBeNull();
    expect(parseClientAnalyticsEvent(42)).toBeNull();
    expect(parseClientAnalyticsEvent(undefined)).toBeNull();
  });

  it("rejects a body with no name at all", () => {
    expect(parseClientAnalyticsEvent({ tool: "merge-pdf" })).toBeNull();
  });

  it("never includes a filename or file-content-shaped field even if the caller tries to smuggle one in", () => {
    const result = parseClientAnalyticsEvent({
      name: "file_upload",
      tool: "merge-pdf",
      fileName: "my-secret-report.pdf",
      contents: "%PDF-1.4 ...",
    });
    expect(result).toEqual({ name: "file_upload", tool: "merge-pdf" });
    expect(result).not.toHaveProperty("fileName");
    expect(result).not.toHaveProperty("contents");
  });
});

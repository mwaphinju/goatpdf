import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const sendGAEventMock = vi.fn();
vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: (...args: unknown[]) => sendGAEventMock(...args),
}));

async function loadGa() {
  // ga.ts reads NEXT_PUBLIC_GA_MEASUREMENT_ID once at module-evaluation time
  // (matching how Next.js actually inlines it at build time), so each test
  // needs a fresh module instance to see its own process.env value.
  vi.resetModules();
  return import("@/lib/analytics/ga");
}

beforeEach(() => {
  sendGAEventMock.mockClear();
  delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ORIGINAL;
});

describe("isGaEnabled", () => {
  it("is false when no Measurement ID is configured (the default)", async () => {
    const { isGaEnabled } = await loadGa();
    expect(isGaEnabled()).toBe(false);
  });

  it("is true once a Measurement ID is configured", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { isGaEnabled } = await loadGa();
    expect(isGaEnabled()).toBe(true);
  });
});

describe("GA4 event helpers — disabled (no Measurement ID)", () => {
  it("never call sendGAEvent, for any event", async () => {
    const ga = await loadGa();
    ga.trackToolView("merge-pdf");
    ga.trackFileUpload("merge-pdf", 2);
    ga.trackProcessingStarted("merge-pdf", 2);
    ga.trackProcessingCompleted("merge-pdf");
    ga.trackProcessingFailed("merge-pdf");
    ga.trackFileDownload("merge-pdf");

    expect(sendGAEventMock).not.toHaveBeenCalled();
  });
});

describe("GA4 event helpers — enabled", () => {
  it("trackToolView sends tool_view with tool_name", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackToolView } = await loadGa();
    trackToolView("compress-pdf");
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "tool_view", { tool_name: "compress-pdf" });
  });

  it("trackFileUpload sends file_upload with tool_name and file_count", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackFileUpload } = await loadGa();
    trackFileUpload("jpg-to-pdf", 3);
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "file_upload", {
      tool_name: "jpg-to-pdf",
      file_count: 3,
    });
  });

  it("trackProcessingStarted sends processing_started with tool_name and file_count", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackProcessingStarted } = await loadGa();
    trackProcessingStarted("split-pdf", 1);
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "processing_started", {
      tool_name: "split-pdf",
      file_count: 1,
    });
  });

  it("trackProcessingCompleted sends processing_completed with success: true", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackProcessingCompleted } = await loadGa();
    trackProcessingCompleted("rotate-pdf");
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "processing_completed", {
      tool_name: "rotate-pdf",
      success: true,
    });
  });

  it("trackProcessingFailed sends processing_failed with success: false", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackProcessingFailed } = await loadGa();
    trackProcessingFailed("pdf-to-word");
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "processing_failed", {
      tool_name: "pdf-to-word",
      success: false,
    });
  });

  it("trackFileDownload sends file_download with tool_name only", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const { trackFileDownload } = await loadGa();
    trackFileDownload("pdf-to-jpg");
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "file_download", { tool_name: "pdf-to-jpg" });
  });

  it("never throws even if sendGAEvent itself throws", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    sendGAEventMock.mockImplementation(() => {
      throw new Error("dataLayer not ready");
    });
    const { trackToolView } = await loadGa();
    expect(() => trackToolView("merge-pdf")).not.toThrow();
  });
});

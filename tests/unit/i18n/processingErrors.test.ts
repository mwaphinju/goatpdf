import { describe, expect, it } from "vitest";
import { localizeProcessingErrorMessage } from "@/i18n/processingErrors";

describe("localizeProcessingErrorMessage", () => {
  it("always returns the real server message verbatim for English, regardless of code", () => {
    expect(localizeProcessingErrorMessage("UNREADABLE_FILE", "\"scan.pdf\" couldn't be read.", "en")).toBe(
      "\"scan.pdf\" couldn't be read.",
    );
    expect(localizeProcessingErrorMessage(undefined, "Something went wrong.", "en")).toBe("Something went wrong.");
  });

  it("defaults to English (the real server message) when no locale is passed", () => {
    expect(localizeProcessingErrorMessage("UNREADABLE_FILE", "The real server message.")).toBe(
      "The real server message.",
    );
  });

  it("prefers a mapped German message over the raw server message for a recognized code", () => {
    const result = localizeProcessingErrorMessage("UNREADABLE_FILE", "\"scan.pdf\" couldn't be read.", "de");
    expect(result).not.toBe("\"scan.pdf\" couldn't be read.");
    expect(result).toContain("beschädigt oder passwortgeschützt");
  });

  it("maps every JobErrorCode that can actually occur for the 4 launched German tools", () => {
    for (const code of [
      "UNREADABLE_FILE",
      "TOTAL_SIZE_TOO_LARGE",
      "VALIDATION_FAILED",
      "TOO_FEW_FILES",
      "TOO_MANY_FILES",
      "PROCESSING_TIMEOUT",
      "PROCESSING_FAILED",
    ]) {
      const result = localizeProcessingErrorMessage(code, "fallback english text", "de");
      expect(result).not.toBe("fallback english text");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the real server message in German for an unmapped or unknown code, never a blank or broken string", () => {
    expect(localizeProcessingErrorMessage("UNKNOWN_TOOL", "The real server message.", "de")).toBe(
      "The real server message.",
    );
    expect(localizeProcessingErrorMessage("NOT_IMPLEMENTED", "The real server message.", "de")).toBe(
      "The real server message.",
    );
    expect(localizeProcessingErrorMessage("SOME_FUTURE_CODE", "The real server message.", "de")).toBe(
      "The real server message.",
    );
  });

  it("falls back to the server message when no code is present at all, even for German", () => {
    expect(localizeProcessingErrorMessage(undefined, "The real server message.", "de")).toBe(
      "The real server message.",
    );
  });
});

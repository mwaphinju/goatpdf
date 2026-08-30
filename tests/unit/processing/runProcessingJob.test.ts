import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "@/lib/files/validate";
import { runProcessingJob, runProcessingJobWithConfig } from "@/lib/processing/runProcessingJob";
import { TOOL_CONFIGS } from "@/lib/processing/toolConfigs";
import { TOOL_IDS } from "@/lib/processing/types";
import type { RawUploadedFile, ToolConfig, ToolProcessor } from "@/lib/processing/types";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-processing");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

const PDF_BYTES = Buffer.from("%PDF-1.4\n%%EOF");
const SECRET_MARKER = "TOTALLY-CONFIDENTIAL-DOCUMENT-CONTENTS-4f8c2";

function pdfInput(overrides: Partial<RawUploadedFile> = {}): RawUploadedFile {
  return {
    fileName: "input.pdf",
    mimeType: "application/pdf",
    size: PDF_BYTES.length,
    buffer: PDF_BYTES,
    ...overrides,
  };
}

function makeConfig(processor: ToolProcessor, overrides: Partial<ToolConfig> = {}): ToolConfig {
  return {
    id: "compress-pdf",
    label: "Test Tool",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: 5_000,
    processor,
    ...overrides,
  };
}

describe("runProcessingJobWithConfig — valid files", () => {
  it("stages the file into a job workspace and returns the processor's output", async () => {
    let receivedPath = "";
    const config = makeConfig(async (ctx) => {
      receivedPath = ctx.files[0].path;
      return { outputs: [{ path: ctx.files[0].path, fileName: "result.pdf", contentType: "application/pdf" }] };
    });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputs).toEqual([
        { path: receivedPath, fileName: "result.pdf", contentType: "application/pdf" },
      ]);
      const stats = await fs.stat(receivedPath);
      expect(stats.isFile()).toBe(true);
    }
  });

  it("gives the processor a random on-disk path rather than the original filename", async () => {
    let capturedFileName = "";
    const config = makeConfig(async (ctx) => {
      capturedFileName = path.basename(ctx.files[0].path);
      return { outputs: [] };
    });

    await runProcessingJobWithConfig("test-tool", config, [
      pdfInput({ fileName: "../../etc/My Secret Report.pdf" }),
    ]);

    expect(capturedFileName).not.toContain("Secret");
    expect(capturedFileName).not.toContain("..");
  });
});

describe("runProcessingJobWithConfig — invalid files", () => {
  it("rejects before ever calling the processor", async () => {
    const processor = vi.fn(async () => ({ outputs: [] }));
    const config = makeConfig(processor);

    const result = await runProcessingJobWithConfig("test-tool", config, [
      pdfInput({ mimeType: "text/plain", fileName: "notes.txt" }),
    ]);

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(processor).not.toHaveBeenCalled();
  });

  it("rejects too few files without touching disk", async () => {
    const processor = vi.fn(async () => ({ outputs: [] }));
    const config = makeConfig(processor, { minFiles: 2, maxFiles: 5 });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result).toMatchObject({ ok: false, code: "TOO_FEW_FILES" });
    expect(processor).not.toHaveBeenCalled();
  });

  it("rejects too many files", async () => {
    const processor = vi.fn(async () => ({ outputs: [] }));
    const config = makeConfig(processor, { minFiles: 1, maxFiles: 1 });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput(), pdfInput()]);

    expect(result).toMatchObject({ ok: false, code: "TOO_MANY_FILES" });
    expect(processor).not.toHaveBeenCalled();
  });

  it("returns UNKNOWN_TOOL for an unregistered tool id via the public entry point", async () => {
    const result = await runProcessingJob("not-a-real-tool", [pdfInput()]);
    expect(result).toEqual({ ok: false, code: "UNKNOWN_TOOL", message: expect.any(String) });
  });
});

describe("runProcessingJobWithConfig — oversized files", () => {
  it("rejects a file larger than the tool's configured limit", async () => {
    const processor = vi.fn(async () => ({ outputs: [] }));
    const config = makeConfig(processor, { maxFileSizeBytes: 10 });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput({ size: 1000 })]);

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(processor).not.toHaveBeenCalled();
  });
});

describe("runProcessingJobWithConfig — cleanup", () => {
  it("cleans up the job workspace when the processor fails", async () => {
    let workspaceDir = "";
    const config = makeConfig(async (ctx) => {
      workspaceDir = ctx.workspaceDir;
      throw new Error("boom");
    });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result.ok).toBe(false);
    await expect(fs.stat(workspaceDir)).rejects.toThrow();
  });

  it("leaves the job workspace in place on success (so a later download step can read it)", async () => {
    let workspaceDir = "";
    const config = makeConfig(async (ctx) => {
      workspaceDir = ctx.workspaceDir;
      return { outputs: [] };
    });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result.ok).toBe(true);
    const stats = await fs.stat(workspaceDir);
    expect(stats.isDirectory()).toBe(true);
  });
});

describe("runProcessingJobWithConfig — processing errors", () => {
  it("converts a thrown error into a generic, safe message and PROCESSING_FAILED code", async () => {
    const config = makeConfig(async () => {
      throw new Error("Internal detail: /var/secrets/db-password.txt was unreadable");
    });

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result).toMatchObject({ ok: false, code: "PROCESSING_FAILED" });
    if (!result.ok) {
      expect(result.message).not.toContain("db-password");
      expect(result.message).not.toContain("/var/secrets");
    }
  });

  it("times out a processor that never resolves and reports PROCESSING_TIMEOUT", async () => {
    const config = makeConfig(
      () => new Promise(() => {}), // never resolves
      { timeoutMs: 30 },
    );

    const result = await runProcessingJobWithConfig("test-tool", config, [pdfInput()]);

    expect(result).toMatchObject({ ok: false, code: "PROCESSING_TIMEOUT" });
  });

  it("reports NOT_IMPLEMENTED for every tool that's still a placeholder", async () => {
    // merge-pdf (Phase 3) and split-pdf (Phase 4) have real implementations now —
    // covered by tests/unit/pdf/mergePdf.test.ts and tests/unit/pdf/splitPdf.test.ts instead.
    const implementedToolIds = new Set(["merge-pdf", "split-pdf"]);
    const placeholderToolIds = TOOL_IDS.filter((id) => !implementedToolIds.has(id));

    for (const toolId of placeholderToolIds) {
      const config = TOOL_CONFIGS[toolId];
      const files = Array.from({ length: config.minFiles }, (_, i) =>
        pdfInput({
          fileName: `input-${i}.${config.acceptedKinds[0] === "jpeg" ? "jpg" : "pdf"}`,
          mimeType: config.acceptedKinds[0] === "jpeg" ? "image/jpeg" : "application/pdf",
          buffer: config.acceptedKinds[0] === "jpeg" ? Buffer.from([0xff, 0xd8, 0xff, 0x00]) : PDF_BYTES,
          size: config.acceptedKinds[0] === "jpeg" ? 4 : PDF_BYTES.length,
        }),
      );

      const result = await runProcessingJob(toolId, files);
      expect(result).toMatchObject({ ok: false, code: "NOT_IMPLEMENTED" });
    }
  });

  it("never logs document contents, even when a job fails", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const secretBuffer = Buffer.concat([PDF_BYTES, Buffer.from(SECRET_MARKER)]);
    const config = makeConfig(async () => {
      throw new Error(`processing failed while reading ${SECRET_MARKER}`);
    });

    await runProcessingJobWithConfig("test-tool", config, [
      pdfInput({ buffer: secretBuffer, size: secretBuffer.length, fileName: `${SECRET_MARKER}.pdf` }),
    ]);

    const allLoggedText = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls]
      .flat()
      .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
      .join("\n");

    expect(allLoggedText).not.toContain(SECRET_MARKER);

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe("cross-check", () => {
  it("processing tool ids match the UI tool registry's slugs", async () => {
    const { tools } = await import("@/lib/tools");
    const uiSlugs = tools.map((tool) => tool.slug).sort();
    const processingIds = [...TOOL_IDS].sort();
    expect(processingIds).toEqual(uiSlugs);
  });
});

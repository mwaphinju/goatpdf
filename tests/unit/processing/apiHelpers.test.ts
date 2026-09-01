import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildJobResponse } from "@/lib/processing/apiHelpers";
import { createJobWorkspace, listWorkspaces } from "@/lib/files/tempStorage";
import { consumeJobOutput, _resetJobRegistryForTests } from "@/lib/processing/jobRegistry";
import type { JobResult } from "@/lib/processing/runProcessingJob";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-apihelpers");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

describe("buildJobResponse", () => {
  it("registers a real output file and returns its size", async () => {
    _resetJobRegistryForTests();
    const workspace = await createJobWorkspace();
    const outputPath = path.join(workspace.dir, "output.pdf");
    await fs.writeFile(outputPath, Buffer.from("fake pdf bytes"));

    const result: JobResult = {
      ok: true,
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      outputs: [{ path: outputPath, fileName: "merged.pdf", contentType: "application/pdf" }],
    };

    const response = await buildJobResponse(result, "merge-pdf");
    const body = (await response.json()) as { jobId: string; fileSize: number };

    expect(response.status).toBe(200);
    expect(body.jobId).toBe(workspace.id);
    expect(body.fileSize).toBeGreaterThan(0);
    expect(consumeJobOutput(workspace.id)).toBeDefined();
  });

  it("cleans up the workspace and returns a safe error when the claimed output file doesn't actually exist", async () => {
    _resetJobRegistryForTests();
    const workspace = await createJobWorkspace();
    const missingPath = path.join(workspace.dir, "never-written.pdf");

    const result: JobResult = {
      ok: true,
      jobId: workspace.id,
      workspaceDir: workspace.dir,
      outputs: [{ path: missingPath, fileName: "merged.pdf", contentType: "application/pdf" }],
    };

    const response = await buildJobResponse(result, "merge-pdf");
    const body = (await response.json()) as { code: string };

    expect(response.status).toBe(500);
    expect(body.code).toBe("PROCESSING_FAILED");
    expect(consumeJobOutput(workspace.id)).toBeUndefined();

    const workspaces = await listWorkspaces();
    expect(workspaces.some((w) => w.id === workspace.id)).toBe(false);
  });
});

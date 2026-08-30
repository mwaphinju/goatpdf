import path from "node:path";
import { createJobWorkspace, removeWorkspace, writeWorkspaceFile } from "@/lib/files/tempStorage";
import { validateFile, type ValidationFailure } from "@/lib/files/validate";
import { ProcessingJobError } from "@/lib/processing/errors";
import { logJobEvent } from "@/lib/processing/logger";
import { getToolConfig } from "@/lib/processing/toolConfigs";
import { withTimeout } from "@/lib/processing/timeout";
import type {
  ProcessingInputFile,
  ProcessingOutputFile,
  RawUploadedFile,
  ToolConfig,
} from "@/lib/processing/types";

export type JobResult =
  | { ok: true; jobId: string; workspaceDir: string; outputs: ProcessingOutputFile[] }
  | { ok: false; code: string; message: string; jobId?: string };

const GENERIC_FAILURE_MESSAGE = "Something went wrong while processing your file. Please try again.";

/**
 * The single entry point every tool runs through: look up the tool's config,
 * validate every input file, stage validated files into a fresh randomly
 * named job workspace, run the tool's processor under a timeout, and return
 * either the resulting output files or a safe, generic error — never a raw
 * stack trace, filesystem path, or file content.
 *
 * A tool's own processing logic is the only thing that changes between
 * tools; validation, storage, timeout handling, error handling, and cleanup
 * are identical for all 8 tools.
 */
export async function runProcessingJob(toolId: string, files: RawUploadedFile[]): Promise<JobResult> {
  const config = getToolConfig(toolId);
  if (!config) {
    return { ok: false, code: "UNKNOWN_TOOL", message: "That tool doesn't exist." };
  }

  return runProcessingJobWithConfig(toolId, config, files);
}

/**
 * The shared orchestration logic, decoupled from the real tool registry so
 * it can be exercised directly with a test double config (a processor that
 * succeeds, throws, or never resolves) without depending on any of the 8
 * tools actually being implemented yet.
 */
export async function runProcessingJobWithConfig(
  toolId: string,
  config: ToolConfig,
  files: RawUploadedFile[],
): Promise<JobResult> {
  if (files.length < config.minFiles) {
    return {
      ok: false,
      code: "TOO_FEW_FILES",
      message: `${config.label} needs at least ${config.minFiles} file${config.minFiles === 1 ? "" : "s"}.`,
    };
  }

  if (files.length > config.maxFiles) {
    return {
      ok: false,
      code: "TOO_MANY_FILES",
      message: `${config.label} accepts at most ${config.maxFiles} file${config.maxFiles === 1 ? "" : "s"} at a time.`,
    };
  }

  const failures: ValidationFailure[] = [];
  const validated = files.map((file) => {
    const result = validateFile(file, config.acceptedKinds, config.maxFileSizeBytes);
    if (!result.ok) failures.push(result);
    return result;
  });

  if (failures.length > 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: failures[0].message };
  }

  const workspace = await createJobWorkspace();
  const startedAt = Date.now();
  logJobEvent({ jobId: workspace.id, toolId, event: "job_started" });

  try {
    const inputFiles: ProcessingInputFile[] = await Promise.all(
      files.map(async (file, index) => {
        const result = validated[index];
        if (!result.ok) throw new Error("unreachable: validation already checked above");
        const extension = path.extname(result.safeName) || "";
        const filePath = await writeWorkspaceFile(workspace.dir, extension, file.buffer);
        return { path: filePath, safeName: result.safeName, kind: result.kind };
      }),
    );

    const result = await withTimeout(
      config.processor({ jobId: workspace.id, workspaceDir: workspace.dir, files: inputFiles }),
      config.timeoutMs,
    );

    logJobEvent({
      jobId: workspace.id,
      toolId,
      event: "job_succeeded",
      durationMs: Date.now() - startedAt,
    });

    return { ok: true, jobId: workspace.id, workspaceDir: workspace.dir, outputs: result.outputs };
  } catch (error) {
    const code = error instanceof ProcessingJobError ? error.code : "PROCESSING_FAILED";
    const message = error instanceof ProcessingJobError ? error.message : GENERIC_FAILURE_MESSAGE;

    logJobEvent({
      jobId: workspace.id,
      toolId,
      event: code === "PROCESSING_TIMEOUT" ? "job_timed_out" : "job_failed",
      errorCode: code,
      durationMs: Date.now() - startedAt,
    });

    await removeWorkspace(workspace.dir).catch(() => {
      // Best-effort cleanup; the periodic sweep is the backstop if this fails.
    });

    return { ok: false, code, message, jobId: workspace.id };
  }
}

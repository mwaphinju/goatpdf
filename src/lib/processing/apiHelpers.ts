import { promises as fs } from "node:fs";
import { removeWorkspace } from "@/lib/files/tempStorage";
import { registerJobOutput } from "@/lib/processing/jobRegistry";
import type { JobResult } from "@/lib/processing/runProcessingJob";
import type { RawUploadedFile } from "@/lib/processing/types";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const JOB_ERROR_HTTP_STATUS: Record<string, number> = {
  UNKNOWN_TOOL: 400,
  TOO_FEW_FILES: 400,
  TOO_MANY_FILES: 400,
  VALIDATION_FAILED: 400,
  UNREADABLE_FILE: 422,
  TOTAL_SIZE_TOO_LARGE: 413,
  PROCESSING_TIMEOUT: 504,
  PROCESSING_FAILED: 500,
  NOT_IMPLEMENTED: 501,
  RATE_LIMITED: 429,
};

// Shared across all 8 processing endpoints (not per-tool) so a client can't
// bypass the limit by spreading requests across different tools.
export const PROCESS_RATE_LIMIT_PER_WINDOW = 20;
// The download route is read-only and normally called exactly once per
// completed job, right after processing — a more generous limit than the
// processing routes, mainly to blunt scripted job-id guessing attempts.
export const DOWNLOAD_RATE_LIMIT_PER_WINDOW = 60;

/** Returns a 429 Response if this request's IP has exceeded the given scope's rate limit, or null if it's within bounds. */
export function rateLimitResponse(request: Request, scope: string, limit: number): Response | null {
  const result = checkRateLimit(request, scope, limit);
  if (result.ok) return null;

  return Response.json(
    { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}

/** Pulls every entry under `fieldName` out of a multipart FormData as raw file buffers, ready for runProcessingJob. */
export async function extractFilesFromFormData(
  formData: FormData,
  fieldName = "files",
): Promise<RawUploadedFile[]> {
  const entries = formData.getAll(fieldName);
  const files: RawUploadedFile[] = [];

  for (const entry of entries) {
    if (typeof entry === "string" || !("arrayBuffer" in entry)) continue;
    const arrayBuffer = await entry.arrayBuffer();
    files.push({
      fileName: entry.name,
      mimeType: entry.type,
      size: entry.size,
      buffer: Buffer.from(arrayBuffer),
    });
  }

  return files;
}

/** Shared shape every tool route responds with: either a safe error, or a registered single-use download link. `toolId` is threaded through to the registry purely so the download route can report which tool produced the file for analytics — it plays no role in validation or processing. */
export async function buildJobResponse(result: JobResult, toolId: string): Promise<Response> {
  if (!result.ok) {
    const status = JOB_ERROR_HTTP_STATUS[result.code] ?? 500;
    return Response.json({ code: result.code, message: result.message }, { status });
  }

  const output = result.outputs[0];
  if (!output) {
    await removeWorkspace(result.workspaceDir).catch(() => {});
    return Response.json(
      { code: "PROCESSING_FAILED", message: "Something went wrong while processing your file." },
      { status: 500 },
    );
  }

  const stats = await fs.stat(output.path);

  registerJobOutput(result.jobId, {
    filePath: output.path,
    fileName: output.fileName,
    contentType: output.contentType,
    workspaceDir: result.workspaceDir,
    toolId,
  });

  return Response.json({
    jobId: result.jobId,
    downloadUrl: `/api/download/${result.jobId}`,
    fileName: output.fileName,
    fileSize: stats.size,
  });
}

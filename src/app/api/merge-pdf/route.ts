import { promises as fs } from "node:fs";
import { removeWorkspace } from "@/lib/files/tempStorage";
import { registerJobOutput } from "@/lib/processing/jobRegistry";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { RawUploadedFile } from "@/lib/processing/types";

export const runtime = "nodejs";

const ERROR_STATUS: Record<string, number> = {
  UNKNOWN_TOOL: 400,
  TOO_FEW_FILES: 400,
  TOO_MANY_FILES: 400,
  VALIDATION_FAILED: 400,
  UNREADABLE_FILE: 422,
  TOTAL_SIZE_TOO_LARGE: 413,
  PROCESSING_TIMEOUT: 504,
  PROCESSING_FAILED: 500,
  NOT_IMPLEMENTED: 501,
};

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "The upload couldn't be read. Please try again." },
      { status: 400 },
    );
  }

  const entries = formData.getAll("files");
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

  const result = await runProcessingJob("merge-pdf", files);

  if (!result.ok) {
    const status = ERROR_STATUS[result.code] ?? 500;
    return Response.json({ code: result.code, message: result.message }, { status });
  }

  const output = result.outputs[0];
  if (!output) {
    await removeWorkspace(result.workspaceDir).catch(() => {});
    return Response.json(
      { code: "PROCESSING_FAILED", message: "Something went wrong while merging your files." },
      { status: 500 },
    );
  }

  const stats = await fs.stat(output.path);

  registerJobOutput(result.jobId, {
    filePath: output.path,
    fileName: output.fileName,
    workspaceDir: result.workspaceDir,
  });

  return Response.json({
    jobId: result.jobId,
    downloadUrl: `/api/download/${result.jobId}`,
    fileName: output.fileName,
    fileSize: stats.size,
  });
}

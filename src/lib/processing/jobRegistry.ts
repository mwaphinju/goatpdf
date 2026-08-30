export interface RegisteredJobOutput {
  filePath: string;
  fileName: string;
  contentType: string;
  workspaceDir: string;
  /** Which tool produced this output — reported as the `tool` parameter on the download_completed analytics event. */
  toolId: string;
}

/**
 * Maps a completed job's id to its output file, so a later GET /api/download
 * request can find it. In-memory only, matching CLAUDE.md's decision not to
 * add a database for MVP — job state does not need to survive a restart.
 */
const registry = new Map<string, RegisteredJobOutput>();

export function registerJobOutput(jobId: string, output: RegisteredJobOutput): void {
  registry.set(jobId, output);
}

/** Retrieves and immediately unregisters a job's output — download links are single-use. */
export function consumeJobOutput(jobId: string): RegisteredJobOutput | undefined {
  const entry = registry.get(jobId);
  if (entry) registry.delete(jobId);
  return entry;
}

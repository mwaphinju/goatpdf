export interface RegisteredJobOutput {
  filePath: string;
  fileName: string;
  contentType: string;
  workspaceDir: string;
  /** Which tool produced this output — reported as the `tool` parameter on the download_completed analytics event. */
  toolId: string;
}

interface RegistryEntry extends RegisteredJobOutput {
  registeredAt: number;
}

/**
 * Maps a completed job's id to its output file, so a later GET /api/download
 * request can find it. In-memory only, matching CLAUDE.md's decision not to
 * add a database for MVP — job state does not need to survive a restart.
 */
const registry = new Map<string, RegistryEntry>();

export function registerJobOutput(jobId: string, output: RegisteredJobOutput): void {
  registry.set(jobId, { ...output, registeredAt: Date.now() });
}

/** Retrieves and immediately unregisters a job's output — download links are single-use. */
export function consumeJobOutput(jobId: string): RegisteredJobOutput | undefined {
  const entry = registry.get(jobId);
  if (!entry) return undefined;
  registry.delete(jobId);
  return {
    filePath: entry.filePath,
    fileName: entry.fileName,
    contentType: entry.contentType,
    workspaceDir: entry.workspaceDir,
    toolId: entry.toolId,
  };
}

/**
 * Removes registry entries older than ttlMs. Without this, a job that
 * completes but is never downloaded (abandoned tab, dropped connection, bot
 * traffic) leaves its entry in memory for the life of the process — an
 * unbounded, un-swept growth path distinct from (and not covered by) the
 * workspace-directory TTL sweep in files/cleanup.ts, since that sweep has no
 * awareness of this registry. Uses the same TTL as the workspace sweep so an
 * entry and the on-disk file it points to expire together.
 */
export function sweepExpiredJobOutputs(ttlMs: number, now: number = Date.now()): string[] {
  const removed: string[] = [];
  for (const [jobId, entry] of registry) {
    if (now - entry.registeredAt > ttlMs) {
      registry.delete(jobId);
      removed.push(jobId);
    }
  }
  return removed;
}

/** Test-only: clears all registry state so tests don't leak between each other. */
export function _resetJobRegistryForTests(): void {
  registry.clear();
}

import { listWorkspaces, removeWorkspace } from "@/lib/files/tempStorage";
import { sweepExpiredJobOutputs } from "@/lib/processing/jobRegistry";

export const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour
export const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/** Removes any job workspace older than ttlMs. Backstop for jobs that were never explicitly cleaned up (abandoned uploads, crashed downloads, etc). */
export async function sweepExpiredWorkspaces(
  ttlMs: number = JOB_TTL_MS,
  now: number = Date.now(),
): Promise<string[]> {
  const workspaces = await listWorkspaces();
  const removed: string[] = [];

  for (const workspace of workspaces) {
    if (now - workspace.mtimeMs > ttlMs) {
      await removeWorkspace(workspace.dir);
      removed.push(workspace.id);
    }
  }

  return removed;
}

let sweepIntervalHandle: ReturnType<typeof setInterval> | null = null;

/** Starts the periodic cleanup sweep. Idempotent — safe to call more than once (e.g. across dev-server hot reloads). */
export function startCleanupScheduler(intervalMs: number = SWEEP_INTERVAL_MS): void {
  if (sweepIntervalHandle) return;

  sweepIntervalHandle = setInterval(() => {
    sweepExpiredWorkspaces().catch((error: unknown) => {
      console.error("[cleanup] sweep failed:", error instanceof Error ? error.message : error);
    });
    // Same TTL as the workspace sweep above, so an abandoned job's registry
    // entry (in-memory jobId -> output-file pointer) doesn't outlive the
    // on-disk file it points to — see jobRegistry.ts's sweepExpiredJobOutputs.
    sweepExpiredJobOutputs(JOB_TTL_MS);
  }, intervalMs);

  sweepIntervalHandle.unref?.();
}

export function stopCleanupScheduler(): void {
  if (sweepIntervalHandle) {
    clearInterval(sweepIntervalHandle);
    sweepIntervalHandle = null;
  }
}

/**
 * A structurally narrow logging function: it only accepts the specific safe
 * fields below, so it is not possible to accidentally pass file buffers,
 * extracted text, or raw filenames through it. Document contents must never
 * be logged — see CLAUDE.md security requirements.
 */
export interface JobLogEvent {
  jobId: string;
  toolId: string;
  event: "job_started" | "job_succeeded" | "job_failed" | "job_timed_out" | "sweep_removed";
  errorCode?: string;
  durationMs?: number;
}

export function logJobEvent(event: JobLogEvent): void {
  console.log("[processing]", JSON.stringify(event));
}

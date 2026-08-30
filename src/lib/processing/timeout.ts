import { ProcessingTimeoutError } from "@/lib/processing/errors";

export const DEFAULT_PROCESSING_TIMEOUT_MS = 60_000;

/** Races a processor promise against a timeout so a stuck or slow processor can never hang a job indefinitely. */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProcessingTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

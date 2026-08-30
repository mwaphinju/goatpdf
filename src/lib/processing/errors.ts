export type JobErrorCode =
  | "UNKNOWN_TOOL"
  | "TOO_FEW_FILES"
  | "TOO_MANY_FILES"
  | "VALIDATION_FAILED"
  | "UNREADABLE_FILE"
  | "TOTAL_SIZE_TOO_LARGE"
  | "PROCESSING_TIMEOUT"
  | "PROCESSING_FAILED"
  | "NOT_IMPLEMENTED";

/** Base class for errors that are safe to translate into a user-facing message and code. Never carry file contents, buffers, or filesystem paths in the message. */
export class ProcessingJobError extends Error {
  readonly code: JobErrorCode;

  constructor(code: JobErrorCode, message: string) {
    super(message);
    this.name = "ProcessingJobError";
    this.code = code;
  }
}

export class ProcessingTimeoutError extends ProcessingJobError {
  constructor(timeoutMs: number) {
    super("PROCESSING_TIMEOUT", `Processing did not finish within ${timeoutMs}ms.`);
    this.name = "ProcessingTimeoutError";
  }
}

export class ToolNotImplementedError extends ProcessingJobError {
  constructor(toolId: string) {
    super("NOT_IMPLEMENTED", `The "${toolId}" tool isn't implemented yet.`);
    this.name = "ToolNotImplementedError";
  }
}

export class UnreadableFileError extends ProcessingJobError {
  constructor(fileName: string) {
    super(
      "UNREADABLE_FILE",
      `"${fileName}" couldn't be read — it may be corrupted or password protected.`,
    );
    this.name = "UnreadableFileError";
  }
}

export class TotalSizeTooLargeError extends ProcessingJobError {
  constructor(maxTotalMb: number) {
    super("TOTAL_SIZE_TOO_LARGE", `The combined file size is too large (limit: ${maxTotalMb} MB total).`);
    this.name = "TotalSizeTooLargeError";
  }
}

/** A tool's own options (e.g. split-pdf's mode/ranges) failed validation inside the processor, after the generic per-file checks already passed. */
export class InvalidOptionsError extends ProcessingJobError {
  constructor(message: string) {
    super("VALIDATION_FAILED", message);
    this.name = "InvalidOptionsError";
  }
}

/**
 * A well-formed, readable PDF (already passed loadPdfOrThrow) could still
 * not be converted — the external LibreOffice process failed, timed out,
 * or produced no output. Not necessarily the user's fault; the message is
 * deliberately non-committal about the cause rather than guessing.
 */
export class ConversionFailedError extends ProcessingJobError {
  constructor() {
    super(
      "PROCESSING_FAILED",
      "We couldn't convert this PDF to Word. It may be too complex, use unsupported formatting, or be password-protected. Please try again, or try a different tool.",
    );
    this.name = "ConversionFailedError";
  }
}

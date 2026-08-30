import type { SupportedFileKind } from "@/lib/files/validate";

export const TOOL_IDS = [
  "compress-pdf",
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "delete-pages",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "pdf-to-word",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export interface RawUploadedFile {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface ProcessingInputFile {
  /** Absolute path to the file inside the job workspace. */
  path: string;
  /** Sanitized, display-safe original filename. */
  safeName: string;
  kind: SupportedFileKind;
}

export interface ProcessingContext {
  jobId: string;
  workspaceDir: string;
  files: ProcessingInputFile[];
  /** Tool-specific parameters (e.g. split-pdf's mode/ranges). Each processor validates and narrows its own shape — never trust it without checking. */
  options?: unknown;
}

export interface ProcessingOutputFile {
  path: string;
  fileName: string;
  contentType: string;
}

export interface ProcessingResult {
  outputs: ProcessingOutputFile[];
}

export type ToolProcessor = (context: ProcessingContext) => Promise<ProcessingResult>;

export interface ToolConfig {
  id: ToolId;
  label: string;
  acceptedKinds: SupportedFileKind[];
  minFiles: number;
  maxFiles: number;
  maxFileSizeBytes: number;
  timeoutMs: number;
  processor: ToolProcessor;
}

import { MAX_FILE_SIZE_BYTES } from "@/lib/files/validate";
import { compressPdf } from "@/lib/pdf/compressPdf";
import { deletePages } from "@/lib/pdf/deletePages";
import { mergePdf } from "@/lib/pdf/mergePdf";
import { rotatePdf } from "@/lib/pdf/rotatePdf";
import { splitPdf } from "@/lib/pdf/splitPdf";
import { ToolNotImplementedError } from "@/lib/processing/errors";
import { DEFAULT_PROCESSING_TIMEOUT_MS } from "@/lib/processing/timeout";
import type { ToolConfig, ToolId, ToolProcessor } from "@/lib/processing/types";

/**
 * Every tool's processor is a placeholder for now — this phase builds the
 * shared validation/storage/timeout/error-handling architecture that each
 * tool will plug a real implementation into, one tool at a time, in a later
 * phase. Swapping a processor here is the only change a future phase needs
 * to make; nothing else in the pipeline changes.
 */
function notImplemented(toolId: ToolId): ToolProcessor {
  return async () => {
    throw new ToolNotImplementedError(toolId);
  };
}

export const TOOL_CONFIGS: Record<ToolId, ToolConfig> = {
  "compress-pdf": {
    id: "compress-pdf",
    label: "Compress PDF",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    // Recompressing many embedded images can take longer than the pure page-manipulation tools.
    timeoutMs: 90_000,
    processor: compressPdf,
  },
  "merge-pdf": {
    id: "merge-pdf",
    label: "Merge PDF",
    acceptedKinds: ["pdf"],
    minFiles: 2,
    maxFiles: 20,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: mergePdf,
  },
  "split-pdf": {
    id: "split-pdf",
    label: "Split PDF",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: splitPdf,
  },
  "rotate-pdf": {
    id: "rotate-pdf",
    label: "Rotate PDF",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: rotatePdf,
  },
  "delete-pdf-pages": {
    id: "delete-pdf-pages",
    label: "Delete PDF Pages",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: deletePages,
  },
  "jpg-to-pdf": {
    id: "jpg-to-pdf",
    label: "JPG to PDF",
    acceptedKinds: ["jpeg"],
    minFiles: 1,
    maxFiles: 30,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: notImplemented("jpg-to-pdf"),
  },
  "pdf-to-jpg": {
    id: "pdf-to-jpg",
    label: "PDF to JPG",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    timeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
    processor: notImplemented("pdf-to-jpg"),
  },
  "pdf-to-word": {
    id: "pdf-to-word",
    label: "PDF to Word",
    acceptedKinds: ["pdf"],
    minFiles: 1,
    maxFiles: 1,
    // LibreOffice conversion is slower than the pure-JS tools; give it more room.
    timeoutMs: 120_000,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    processor: notImplemented("pdf-to-word"),
  },
};

export function getToolConfig(toolId: string): ToolConfig | undefined {
  return TOOL_CONFIGS[toolId as ToolId];
}

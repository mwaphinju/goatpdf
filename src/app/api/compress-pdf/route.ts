import {
  buildJobResponse,
  extractFilesFromFormData,
  PROCESS_RATE_LIMIT_PER_WINDOW,
  rateLimitResponse,
} from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { CompressPdfOptions } from "@/lib/pdf/compressPdf";

export const runtime = "nodejs";

const VALID_PRESETS: CompressPdfOptions["preset"][] = ["recommended", "high-quality", "maximum-compression"];

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "process", PROCESS_RATE_LIMIT_PER_WINDOW);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "The upload couldn't be read. Please try again." },
      { status: 400 },
    );
  }

  const files = await extractFilesFromFormData(formData);

  const presetRaw = formData.get("preset");
  const preset = VALID_PRESETS.find((candidate) => candidate === presetRaw);
  if (!preset) {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "Choose a compression level before continuing." },
      { status: 400 },
    );
  }

  const options: CompressPdfOptions = { preset };
  const result = await runProcessingJob("compress-pdf", files, options);
  return buildJobResponse(result);
}

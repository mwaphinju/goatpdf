import {
  buildJobResponse,
  extractFilesFromFormData,
  PROCESS_RATE_LIMIT_PER_WINDOW,
  rateLimitResponse,
} from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { JpgToPdfOptions } from "@/lib/pdf/jpgToPdf";

export const runtime = "nodejs";

const PAGE_SIZES: JpgToPdfOptions["pageSize"][] = ["a4", "letter", "fit"];
const ORIENTATIONS: JpgToPdfOptions["orientation"][] = ["portrait", "landscape"];
const MARGINS: JpgToPdfOptions["margin"][] = ["none", "small", "normal"];

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

  const pageSize = PAGE_SIZES.find((candidate) => candidate === formData.get("pageSize"));
  const orientation = ORIENTATIONS.find((candidate) => candidate === formData.get("orientation"));
  const margin = MARGINS.find((candidate) => candidate === formData.get("margin"));

  if (!pageSize || !orientation || !margin) {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "Choose a page size, orientation, and margin before continuing." },
      { status: 400 },
    );
  }

  const options: JpgToPdfOptions = { pageSize, orientation, margin };
  const result = await runProcessingJob("jpg-to-pdf", files, options);
  return buildJobResponse(result);
}

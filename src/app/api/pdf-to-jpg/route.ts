import {
  buildJobResponse,
  extractFilesFromFormData,
  PROCESS_RATE_LIMIT_PER_WINDOW,
  rateLimitResponse,
} from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { PdfToJpgOptions } from "@/lib/pdf/pdfToJpg";

export const runtime = "nodejs";

const QUALITIES: PdfToJpgOptions["quality"][] = ["low", "medium", "high"];

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

  const quality = QUALITIES.find((candidate) => candidate === formData.get("quality"));
  if (!quality) {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "Choose an image quality before continuing." },
      { status: 400 },
    );
  }

  const pagesRaw = formData.get("pages");
  let pages: PdfToJpgOptions["pages"] = "all";
  if (typeof pagesRaw === "string" && pagesRaw !== "all") {
    try {
      const parsed: unknown = JSON.parse(pagesRaw);
      pages = Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
    } catch {
      pages = [];
    }
  }

  const options: PdfToJpgOptions = { quality, pages };
  const result = await runProcessingJob("pdf-to-jpg", files, options);
  return buildJobResponse(result);
}

import {
  buildJobResponse,
  extractFilesFromFormData,
  PROCESS_RATE_LIMIT_PER_WINDOW,
  rateLimitResponse,
} from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { RotatePdfOptions } from "@/lib/pdf/rotatePdf";

export const runtime = "nodejs";

function badRequest(message: string) {
  return Response.json({ code: "VALIDATION_FAILED", message }, { status: 400 });
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "process", PROCESS_RATE_LIMIT_PER_WINDOW);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("The upload couldn't be read. Please try again.");
  }

  const files = await extractFilesFromFormData(formData);

  const angleRaw = formData.get("angle");
  const angle = angleRaw === "90" || angleRaw === "180" || angleRaw === "270" ? Number(angleRaw) : null;
  if (!angle) {
    return badRequest("Choose a rotation angle (90°, 180°, or 270°).");
  }

  const pagesRaw = formData.get("pages");
  let pages: RotatePdfOptions["pages"] = "all";
  if (typeof pagesRaw === "string" && pagesRaw !== "all") {
    try {
      const parsed: unknown = JSON.parse(pagesRaw);
      pages = Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
    } catch {
      pages = [];
    }
  }

  const options: RotatePdfOptions = { angle: angle as RotatePdfOptions["angle"], pages };
  const result = await runProcessingJob("rotate-pdf", files, options);
  return buildJobResponse(result);
}

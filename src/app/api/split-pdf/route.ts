import { buildJobResponse, extractFilesFromFormData } from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { SplitPdfOptions } from "@/lib/pdf/splitPdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
  const mode = formData.get("mode");

  let options: SplitPdfOptions;
  if (mode === "ranges") {
    const ranges = formData.get("ranges");
    options = { mode: "ranges", ranges: typeof ranges === "string" ? ranges : "" };
  } else {
    options = { mode: "all-pages" };
  }

  const result = await runProcessingJob("split-pdf", files, options);
  return buildJobResponse(result);
}

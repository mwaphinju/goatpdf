import { buildJobResponse, extractFilesFromFormData } from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";

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
  const result = await runProcessingJob("pdf-to-word", files);
  return buildJobResponse(result);
}
